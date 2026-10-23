/**
 * Standardized Error Handling Middleware for Express
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  next(error);
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');

  console.error(`[Error] ${req.method} ${req.originalUrl} - ${statusCode} [${errorCode}]: ${err.message}`);

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected server error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
