import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Simple in-memory fallback cache for local development without Redis
class MemoryRedis {
  constructor() {
    this.store = new Map();
    console.warn('⚠️ Using In-Memory Cache (Redis is offline).');
  }
  async get(key) {
    return this.store.get(key) || null;
  }
  async set(key, value, ...args) {
    this.store.set(key, value);
    return 'OK';
  }
  async del(key) {
    this.store.delete(key);
    return 1;
  }
  async incr(key) {
    const val = (parseInt(this.store.get(key) || '0') + 1).toString();
    this.store.set(key, val);
    return parseInt(val);
  }
  async expire(key, seconds) {
    return 1;
  }
}

const url = process.env.REDIS_URL || 'redis://localhost:6379';
const isTls = url.startsWith('rediss://') || process.env.REDIS_TLS === 'true';

const redisOptions = {
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  lazyConnect: true
};

if (isTls) {
  redisOptions.tls = { rejectUnauthorized: false };
}

let client = null;

try {
  client = new Redis(url, redisOptions);
  client.on('error', (err) => {
    // Suppress repeated connection logs by converting to warning
  });
  client.connect().catch(() => {});
} catch (err) {
  console.warn('⚠️ Could not initialize Redis client.');
}

let activeClient = client;
let isFallback = false;

// Stable wrapper object to handle queries and fall back on failure
const redisClient = {
  get: async (key) => {
    try {
      if (isFallback || !client || client.status !== 'ready') {
        throw new Error('Redis offline');
      }
      return await client.get(key);
    } catch (err) {
      if (!isFallback) {
        console.warn('⚠️ Redis connection lost. Switching to In-Memory.');
        activeClient = new MemoryRedis();
        isFallback = true;
      }
      return activeClient.get(key);
    }
  },
  set: async (key, value, ...args) => {
    try {
      if (isFallback || !client || client.status !== 'ready') {
        throw new Error('Redis offline');
      }
      return await client.set(key, value, ...args);
    } catch (err) {
      if (!isFallback) {
        console.warn('⚠️ Redis connection lost. Switching to In-Memory.');
        activeClient = new MemoryRedis();
        isFallback = true;
      }
      return activeClient.set(key, value, ...args);
    }
  },
  del: async (key) => {
    try {
      if (isFallback || !client || client.status !== 'ready') {
        throw new Error('Redis offline');
      }
      return await client.del(key);
    } catch (err) {
      if (!isFallback) {
        console.warn('⚠️ Redis connection lost. Switching to In-Memory.');
        activeClient = new MemoryRedis();
        isFallback = true;
      }
      return activeClient.del(key);
    }
  },
  incr: async (key) => {
    try {
      if (isFallback || !client || client.status !== 'ready') {
        throw new Error('Redis offline');
      }
      return await client.incr(key);
    } catch (err) {
      if (!isFallback) {
        console.warn('⚠️ Redis connection lost. Switching to In-Memory.');
        activeClient = new MemoryRedis();
        isFallback = true;
      }
      return activeClient.incr(key);
    }
  },
  expire: async (key, seconds) => {
    try {
      if (isFallback || !client || client.status !== 'ready') {
        throw new Error('Redis offline');
      }
      return await client.expire(key, seconds);
    } catch (err) {
      if (!isFallback) {
        console.warn('⚠️ Redis connection lost. Switching to In-Memory.');
        activeClient = new MemoryRedis();
        isFallback = true;
      }
      return activeClient.expire(key, seconds);
    }
  },
  get status() {
    return isFallback ? 'ready' : (client ? client.status : 'end');
  },
  get isActiveFallback() {
    return isFallback;
  }
};

// Caching helper
export const cacheUrl = async (shortCode, originalUrl, isNew = false) => {
  try {
    const ttl = isNew ? 86400 : 43200; // 24 hours vs 12 hours
    await redisClient.set(shortCode, originalUrl, 'EX', ttl);
  } catch (err) {
    console.error('Error in cacheUrl helper:', err.message);
  }
};

export const getCachedUrl = async (shortCode) => {
  try {
    return await redisClient.get(shortCode);
  } catch (err) {
    console.error('Error in getCachedUrl helper:', err.message);
    return null;
  }
};

export const deleteCachedUrl = async (shortCode) => {
  try {
    await redisClient.del(shortCode);
  } catch (err) {
    console.error('Error in deleteCachedUrl helper:', err.message);
  }
};

export default redisClient;
export { MemoryRedis };
