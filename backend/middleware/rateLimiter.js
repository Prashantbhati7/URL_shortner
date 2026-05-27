import redisClient from '../utils/redis.js';

// In-memory fallback storage for rate limits if Redis is offline
const inMemoryLimits = new Map();

/**
 * Simplified Token Bucket Rate Limiter (Daily Limit)
 * Stored in Redis with 24 hours expiry, falling back to in-memory map.
 */
export const tokenBucketRateLimiter = (options = {}) => {
  const capacity = options.capacity || 100; // max daily requests
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours

  return async (req, res, next) => {
    const clientId = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    const key = `ratelimit:daily:${clientId}`;
    const now = Date.now();

    try {
      if (!redisClient.isActiveFallback) {
        const currentVal = await redisClient.get(key);
        const count = currentVal ? parseInt(currentVal) : 0;

        if (count >= capacity) {
          return res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Daily limit is ${capacity} requests. Please try again later.`
          });
        }

        // Increment count and set 24 hours expiry
        await redisClient.set(key, (count + 1).toString(), 'EX', 86400);
        res.setHeader('X-RateLimit-Limit', capacity);
        res.setHeader('X-RateLimit-Remaining', capacity - (count + 1));
      } else {
        // Fallback: In-memory Map
        let record = inMemoryLimits.get(key);
        if (!record || (now - record.resetTime > windowMs)) {
          record = { count: 1, resetTime: now };
        } else {
          record.count += 1;
        }
        inMemoryLimits.set(key, record);

        if (record.count > capacity) {
          return res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Daily limit is ${capacity} requests. Please try again later.`
          });
        }
        res.setHeader('X-RateLimit-Limit', capacity);
        res.setHeader('X-RateLimit-Remaining', capacity - record.count);
      }
      next();
    } catch (err) {
      console.warn('⚠️ Daily rate limiter error, passing request:', err.message);
      next(); // Maintain availability on limiter error
    }
  };
};

/**
 * Simplified Leaky Bucket Rate Limiter (Traffic Controlling/Smoothing)
 * Stored in Redis with 1 minute expiry, falling back to in-memory map.
 */
export const leakyBucketRateLimiter = (options = {}) => {
  const capacity = options.capacity || 20; // max size of water level/requests
  const windowMs = 60 * 1000; // 1 minute sliding/fixed window

  return async (req, res, next) => {
    const clientId = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    const key = `ratelimit:leaky:${clientId}`;
    const now = Date.now();

    try {
      if (!redisClient.isActiveFallback) {
        const currentVal = await redisClient.get(key);
        const count = currentVal ? parseInt(currentVal) : 0;

        if (count >= capacity) {
          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Too many redirection requests. Flow limit exceeded. Please slow down.'
          });
        }

        // Increment count and set 1 minute expiry
        await redisClient.set(key, (count + 1).toString(), 'EX', 60);
        res.setHeader('X-Concurrency-Limit', capacity);
        res.setHeader('X-Concurrency-Watermark', (count + 1).toString());
      } else {
        // Fallback: In-memory Map
        let record = inMemoryLimits.get(key);
        if (!record || (now - record.resetTime > windowMs)) {
          record = { count: 1, resetTime: now };
        } else {
          record.count += 1;
        }
        inMemoryLimits.set(key, record);

        if (record.count > capacity) {
          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Too many redirection requests. Flow limit exceeded. Please slow down.'
          });
        }
        res.setHeader('X-Concurrency-Limit', capacity);
        res.setHeader('X-Concurrency-Watermark', record.count.toString());
      }
      next();
    } catch (err) {
      console.warn('⚠️ Leaky rate limiter error, passing request:', err.message);
      next(); // Maintain availability on limiter error
    }
  };
};
