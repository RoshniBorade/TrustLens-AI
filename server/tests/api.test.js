/**
 * Automated Integration Test Suite for TrustLens AI Express Backend.
 * Uses Node.js native test runner (node:test) and assert.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const BASE_URL = 'http://127.0.0.1:5000';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

test('GET /health returns healthy status', async () => {
  const res = await makeRequest('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'healthy');
  assert.equal(res.body.service, 'trustlens-server');
});

test('GET /api/v1/health returns sub-service components', async () => {
  const res = await makeRequest('/api/v1/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'healthy');
  assert.ok(res.body.components);
  assert.ok(res.body.components.database);
  assert.ok(res.body.components.ml_service);
});

test('GET /api/v1/nonexistent returns structured 404 error', async () => {
  const res = await makeRequest('/api/v1/nonexistent');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('POST /api/v1/evaluations rejects empty payload with 422', async () => {
  const res = await makeRequest('/api/v1/evaluations', {
    method: 'POST',
    body: {}
  });
  assert.equal(res.status, 422);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /api/v1/evaluations rejects oversized payload (>8000 chars) with 422', async () => {
  const hugeText = 'A'.repeat(8500);
  const res = await makeRequest('/api/v1/evaluations', {
    method: 'POST',
    body: {
      responseText: hugeText
    }
  });
  assert.equal(res.status, 422);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('GET /api/v1/evaluations rejects negative page with 422', async () => {
  const res = await makeRequest('/api/v1/evaluations?page=-5');
  assert.equal(res.status, 422);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('GET /api/v1/evaluations/invalid-id rejects invalid ID format with 422', async () => {
  const res = await makeRequest('/api/v1/evaluations/invalid_format_id');
  assert.equal(res.status, 422);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('Rate limiting headers are returned on API endpoints', async () => {
  const res = await makeRequest('/api/v1/evaluations');
  assert.ok(res.headers['x-ratelimit-limit']);
  assert.ok(res.headers['x-ratelimit-remaining'] !== undefined);
});
