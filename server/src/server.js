const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api.routes');
const healthRoutes = require('./routes/health.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(cors({
  origin: [config.clientOrigin, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root health probe
app.use('/', healthRoutes);

// Mount API v1 router
app.use('/api/v1', apiRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// Start server
async function startServer() {
  // Connect database asynchronously
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(` TrustLens-AI Application Backend running!`);
    console.log(` Port: ${config.port}`);
    console.log(` Environment: ${config.nodeEnv}`);
    console.log(` Health check: http://localhost:${config.port}/health`);
    console.log(` API Status: http://localhost:${config.port}/api/v1/status`);
    console.log(` ML Service Target: ${config.mlServiceUrl}`);
    console.log(`====================================================`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n[Server] Gracefully shutting down...');
    server.close(() => {
      console.log('[Server] Closed remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();

module.exports = app;
