/**
 * In-Memory Sliding Window Rate Limiter Middleware for Express.
 * Protects endpoints from burst requests, CPU starvation, and DoS abuse.
 */

class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 30, message = 'Too many requests. Please try again later.') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message;
    this.clients = new Map();

    // Clean expired entries periodically
    setInterval(() => this.cleanup(), this.windowMs);
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, timestamps] of this.clients.entries()) {
      const valid = timestamps.filter(t => now - t < this.windowMs);
      if (valid.length === 0) {
        this.clients.delete(ip);
      } else {
        this.clients.set(ip, valid);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const now = Date.now();

      if (!this.clients.has(ip)) {
        this.clients.set(ip, []);
      }

      const timestamps = this.clients.get(ip).filter(t => now - t < this.windowMs);
      timestamps.push(now);
      this.clients.set(ip, timestamps);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - timestamps.length));

      if (timestamps.length > this.maxRequests) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: this.message,
            retryAfterSeconds: Math.ceil((timestamps[0] + this.windowMs - now) / 1000),
          },
        });
      }

      next();
    };
  }
}

// 60 requests/minute for general API
const apiRateLimiter = new RateLimiter(60000, 60, 'General API rate limit exceeded (60 req/min).').middleware();

// 20 requests/minute for heavy ML evaluation submissions
const evalRateLimiter = new RateLimiter(60000, 20, 'Evaluation submission rate limit exceeded (20 req/min). Please wait.').middleware();

module.exports = { apiRateLimiter, evalRateLimiter };
