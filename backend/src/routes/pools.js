const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const queries = require('../models/queries');

// GET /api/pools - List all tracked pools
router.get('/', async (req, res) => {
    try {
        const pools = await queries.getAllPools();
        res.json({
            pools: pools.map(p => ({
                address: p.pool_address,
                token0: p.token0,
                token1: p.token1,
                feeTier: p.fee_tier,
                apy: parseFloat(p.apy) || 0,
                tvl: parseFloat(p.tvl) || 0,
                volume24h: parseFloat(p.volume_24h) || 0,
                fee24h: parseFloat(p.fee_24h) || 0,
                lastUpdated: p.timestamp
            })),
            count: pools.length
        });
    } catch (error) {
        logger.error('Error fetching pools', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch pools' });
    }
});

// GET /api/pools/:address - Get single pool details
router.get('/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const pool = await queries.getPoolByAddress(address);

        if (!pool) {
            return res.status(404).json({ error: 'Pool not found' });
        }

        res.json({
            address: pool.pool_address,
            token0: pool.token0,
            token1: pool.token1,
            feeTier: pool.fee_tier,
            apy: parseFloat(pool.apy) || 0,
            tvl: parseFloat(pool.tvl) || 0,
            volume24h: parseFloat(pool.volume_24h) || 0,
            fee24h: parseFloat(pool.fee_24h) || 0,
            lastUpdated: pool.timestamp
        });
    } catch (error) {
        logger.error('Error fetching pool', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch pool' });
    }
});

// GET /api/pools/:address/history - Historical APY
router.get('/:address/history', async (req, res) => {
    try {
        const { address } = req.params;
        const { hours = 24 } = req.query;

        const history = await queries.getPoolHistory(address, parseInt(hours));

        res.json({
            address,
            period: `${hours}h`,
            history: history.map(h => ({
                apy: parseFloat(h.apy),
                tvl: parseFloat(h.tvl),
                volume24h: parseFloat(h.volume_24h),
                timestamp: h.timestamp
            }))
        });
    } catch (error) {
        logger.error('Error fetching history', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// POST /api/pools/refresh - Manual refresh (for testing)
router.post('/discover', async (req, res) => {
    try {
        const { discoverPriorityStablecoinPools } = require('../services/poolDiscovery');

        logger.info('Manual pool discovery triggered via API');
        const result = await discoverPriorityStablecoinPools();

        res.json({
            success: true,
            message: 'Pool discovery completed',
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error in pool discovery', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Pool discovery failed',
            message: error.message
        });
    }
});

module.exports = router;