import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: Redis | null = null;

try {
  redisClient = new Redis(redisUrl);
  console.log('Redis client connected');
} catch (error) {
  console.error('Redis connection error:', error);
}

export const getRedisClient = (): Redis | null => {
  return redisClient;
};

export default redisClient;