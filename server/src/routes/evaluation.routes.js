/**
 * Evaluation Routes for Express Backend.
 */

const express = require('express');
const { submitEvaluation, listEvaluations, getEvaluation } = require('../controllers/evaluation.controller');
const { evaluationSubmitRules, paginationRules, evaluationIdParam, validate } = require('../middleware/validate');
const { apiRateLimiter, evalRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/v1/evaluations - Run full verification and persist report (rate-limited to 20 req/min)
router.post('/', evalRateLimiter, evaluationSubmitRules, validate, submitEvaluation);

// GET /api/v1/evaluations - List evaluation history (paginated, rate-limited to 60 req/min)
router.get('/', apiRateLimiter, paginationRules, validate, listEvaluations);

// GET /api/v1/evaluations/:id - Retrieve individual report
router.get('/:id', apiRateLimiter, evaluationIdParam, validate, getEvaluation);

module.exports = router;
