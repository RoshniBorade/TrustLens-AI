/**
 * Evaluation Controller for TrustLens AI Express Backend.
 *
 * Orchestrates submissions, queries ML FastAPI service, and persists reports in MongoDB.
 */

const Evaluation = require('../models/Evaluation.model');
const { verifyClaimsWithML } = require('../services/mlService');

/**
 * Submits a new text evaluation.
 * Calls FastAPI ML service, formats result, and persists into MongoDB.
 */
async function submitEvaluation(req, res, next) {
  try {
    const { question, query, aiResponse, responseText, useWebSearch, referenceContext } = req.body;
    const finalQuestion = question || query || "General Evaluation Query";
    const finalResponseText = aiResponse || responseText;

    if (!finalResponseText || finalResponseText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'aiResponse / responseText is required',
        },
      });
    }

    // Call FastAPI ML service verification pipeline
    const mlResponse = await verifyClaimsWithML({
      query: finalQuestion,
      response_text: finalResponseText,
      use_web_search: useWebSearch !== false,
      reference_context: referenceContext || null,
    });

    const mlData = mlResponse.data;
    const evalId = mlData.evaluation_id || `eval-${Date.now()}`;
    const metrics = mlData.metrics || {};

    // Transform claims for MongoDB schema
    const formattedClaims = (mlData.claims || []).map((c) => ({
      claimId: c.claim_id,
      text: c.claim_text,
      status: c.status,
      confidence: c.confidence,
      explanation: c.explanation,
      evidence: c.evidence ? {
        sourceUrl: c.evidence.source_url || '',
        sourceTitle: c.evidence.source_title || 'Unknown Source',
        snippet: c.evidence.text || '',
        retrievedAt: new Date(),
      } : null,
    }));

    // Create MongoDB document
    const evaluationDoc = await Evaluation.create({
      evaluationId: evalId,
      question: finalQuestion,
      aiResponse: finalResponseText,
      status: 'completed',
      reliabilityIndex: metrics.reliability_index ?? 0,
      claimCount: metrics.total_claims ?? formattedClaims.length,
      supportedCount: metrics.supported_claims ?? formattedClaims.filter(c => c.status === 'supported').length,
      contradictedCount: metrics.contradicted_claims ?? formattedClaims.filter(c => c.status === 'contradicted').length,
      unverifiedCount: metrics.unverified_claims ?? formattedClaims.filter(c => c.status === 'unverified').length,
      processingTimeMs: Math.round((mlData.evaluation_time_seconds || 0) * 1000),
      modelUsed: 'cross-encoder/nli-deberta-v3-small',
      claims: formattedClaims,
    });

    res.status(201).json({
      success: true,
      data: evaluationDoc,
      raw_ml_response: mlData,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Lists evaluations with pagination.
 */
async function listEvaluations(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    const total = await Evaluation.countDocuments();
    const records = await Evaluation.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: records,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetches an individual evaluation report by ID.
 */
async function getEvaluation(req, res, next) {
  try {
    const { id } = req.params;
    const record = await Evaluation.findOne({
      $or: [{ evaluationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).lean();

    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Evaluation record '${id}' not found`,
        },
      });
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submitEvaluation,
  listEvaluations,
  getEvaluation,
};
