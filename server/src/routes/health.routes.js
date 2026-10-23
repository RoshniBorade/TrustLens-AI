const express = require('express');
const { isDbConnected } = require('../config/db');
const { checkMLHealth } = require('../services/mlService');

const router = express.Router();

router.get('/health', async (req, res) => {
  const dbConnected = isDbConnected();
  const mlHealth = await checkMLHealth();

  // The system is degraded if either DB or ML service is currently offline
  const isHealthy = dbConnected && mlHealth.connected;
  const status = isHealthy ? 'healthy' : 'degraded';

  const healthPayload = {
    status,
    service: 'trustlens-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    components: {
      database: {
        type: 'MongoDB',
        connected: dbConnected,
        status: dbConnected ? 'connected' : 'disconnected',
      },
      ml_service: {
        type: 'Python/FastAPI',
        connected: mlHealth.connected,
        latency_ms: mlHealth.latencyMs,
        details: mlHealth.data || null,
        error: mlHealth.error || null,
      },
    },
    system: {
      node_version: process.version,
      platform: process.platform,
      memory_rss_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
  };

  // Return HTTP 200 even if degraded so monitors can inspect component health
  res.status(200).json(healthPayload);
});

router.get('/ping', (req, res) => {
  res.status(200).json({ pong: true, timestamp: Date.now() });
});

module.exports = router;
