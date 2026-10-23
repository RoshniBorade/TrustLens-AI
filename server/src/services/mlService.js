const axios = require('axios');
const config = require('../config/env');

// Dedicated Axios instance configured for FastAPI ML service communication
const mlClient = axios.create({
  baseURL: config.mlServiceUrl,
  timeout: config.mlServiceTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Pings ML microservice to verify health, model state, and measure latency.
 */
async function checkMLHealth() {
  const startTime = Date.now();
  try {
    const response = await mlClient.get('/health');
    const latencyMs = Date.now() - startTime;
    return {
      connected: true,
      latencyMs,
      data: response.data,
    };
  } catch (error) {
    return {
      connected: false,
      latencyMs: Date.now() - startTime,
      error: error.code === 'ECONNREFUSED'
        ? `ML Service offline at ${config.mlServiceUrl}`
        : error.message,
    };
  }
}

module.exports = {
  mlClient,
  checkMLHealth,
};
