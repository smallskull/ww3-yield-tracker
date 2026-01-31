const redis = require('redis');
const logger = require('../utils/logger');

let client = null;

async function connectRedis() {
    if (client) return client;

    try {
        client = redis.createClient({
            url: process.env.REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Redis reconnection limit reached');
                        return new Error('Redis unavailable');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        client.on('error', (err) => logger.error('Redis error:', err));
        client.on('connect', () => logger.info('Redis connected'));
        client.on('reconnecting', () => logger.warn('Redis reconnecting...'));

        await client.connect();
        return client;
    } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        throw error;
    }
}

async function getRedisClient() {
    if (!client || !client.isOpen) {
        await connectRedis();
    }
    return client;
}

async function closeRedis() {
    if (client) {
        await client.quit();
        client = null;
    }
}

module.exports = {
    connectRedis,
    getRedisClient,
    closeRedis
};