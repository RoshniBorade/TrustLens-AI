/**
 * Evaluation Routes for Express Backend.
 */

const express = require('express');
const { submitEvaluation, listEvaluations, getEvaluation } = require('../controllers/evaluation.controller');
const { evaluationSubmitRules, paginationRules, validate } = require('../middleware/validate');

const router = express.Router();

// POST /api/v1/evaluations - Run full verification and persist report
router.post('/', evaluationSubmitRules, validate, submitEvaluation);

// GET /api/v1/evaluations - List evaluation history (paginated)
router.get('/', paginationRules, validate, listEvaluations);

// GET /api/v1/evaluations/:id - Retrieve individual report
router.get('/:id', getEvaluation);

module.exports = router;
