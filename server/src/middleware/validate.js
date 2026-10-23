const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation chains for submitting a new evaluation.
 * Limits input size to prevent abuse.
 */
const evaluationSubmitRules = [
  body('question')
    .isString().withMessage('question must be a string')
    .isLength({ min: 1, max: 2000 }).withMessage('question length must be 1-2000 characters'),
  body('aiResponse')
    .isString().withMessage('aiResponse must be a string')
    .isLength({ min: 1, max: 8000 }).withMessage('aiResponse length must be 1-8000 characters'),
];

/** Pagination rules for list endpoint */
const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50')
    .toInt(),
];

/** Validation for evaluationId param */
const evaluationIdParam = [
  param('id')
    .isString().withMessage('evaluation id must be a string')
    .matches(/^eval-[a-zA-Z0-9]{10}$/).withMessage('invalid evaluation id format'),
];

/** Middleware to return formatted errors */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: errors.array().map(e => ({ field: e.param, message: e.msg })),
      },
    });
  }
  next();
}

module.exports = { evaluationSubmitRules, paginationRules, evaluationIdParam, validate };
