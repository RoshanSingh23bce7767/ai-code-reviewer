import { createClient } from 'redis';
import logger from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let hasConnectedOnce = false;

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries: number) => {
      // If we haven't successfully connected even once, don't spam reconnection attempts at startup
      if (!hasConnectedOnce && retries >= 1) {
        return new Error('Redis connection failed at startup');
      }
      // If we have connected once, allow up to 5 retry attempts to recover from temporary disconnection
      if (retries >= 5) {
        return new Error('Redis reconnection attempts exhausted');
      }
      // Exponential backoff
      return Math.min(retries * 500 + 500, 5000);
    }
  }
});

redisClient.on('error', (err: any) => {
  // Silence connection failure logs to keep the startup and runtime logs clean
  const errMsg = err?.message || '';
  const errCode = err?.code || '';
  const errStack = err?.stack || '';
  const isConnectionError = 
    err?.name === 'AggregateError' ||
    (typeof AggregateError !== 'undefined' && err instanceof AggregateError) ||
    errCode === 'ECONNREFUSED' ||
    errMsg.includes('ECONNREFUSED') || 
    errMsg.includes('closed') || 
    errMsg.includes('connection failed') ||
    errMsg.includes('attempts exhausted') ||
    errStack.includes('AggregateError') ||
    errStack.includes('ECONNREFUSED');
    
  if (!isConnectionError) {
    logger.error('Redis client error:', err);
  }
});

redisClient.on('connect', () => {
  // Silent connection attempt
});

redisClient.on('ready', () => {
  hasConnectedOnce = true;
  logger.info('Redis client is ready.');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    // Silence startup connection errors completely
  }
};

export default redisClient;
