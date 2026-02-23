// Redis connection
const Redis = require('ioredis');

let redis = null;

const connectRedis = async () => {
  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    await redis.connect();
    console.log('✅ Redis connection established');
    return redis;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    console.log('⚠️ Running without Redis cache');
    return null;
  }
};

const getRedis = () => redis || null;

const cache = {
  async get(key) {
    if (!redis) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  },

  async set(key, value, ttlSeconds = 900) {
    if (!redis) return;
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async del(key) {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  async invalidatePattern(pattern) {
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  },
};

module.exports = { connectRedis, getRedis, cache, redis };
