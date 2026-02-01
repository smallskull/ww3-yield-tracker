const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const queries = require('../models/queries');

// Allowed sort fields (whitelist to prevent SQL injection)
const ALLOWED_SORT_FIELDS = ['apy', 'tvl', 'volume24h', 'fee24h', 'feeTier'];
const DEFAULT_SORT = 'apy';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * GET /api/pools - List all tracked pools with pagination and sorting
 * Query params:
 *   - limit: Number of pools to return (default: 20, max: 50)
 *   - sort: Field to sort by (apy, tvl, volume24h, fee24h, feeTier)
 *   - order: asc or desc (default: desc)
 */
router.get('/', async (req, res) => {
    try {
        // Parse and validate limit
        let limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
        if (limit < 1) limit = DEFAULT_LIMIT;
        if (limit > MAX_LIMIT) limit = MAX_LIMIT;

        // Parse and validate sort field
        let sortField = (req.query.sort || DEFAULT_SORT).toLowerCase();
        if (!ALLOWED_SORT_FIELDS.includes(sortField)) {
            sortField = DEFAULT_SORT;
        }

        // Parse sort order
        const sortOrder = (req.query.order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        logger.info('Fetching pools', { limit, sortField, sortOrder });

        const pools = await queries.getAllPools(limit, sortField, sortOrder);

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
            count: pools.length,
            limit,
            sortBy: sortField,
            sortOrder: sortOrder.toLowerCase()
        });
    } catch (error) {
        logger.error('Error fetching pools', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch pools' });
    }
});

/**
 * GET /api/pools/:address - Get single pool details
 */
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

/**
 * GET /api/pools/:address/history - Historical APY/TVL data (24h by default)
 * Query params:
 *   - hours: Number of hours of history (default: 24, max: 168 = 7 days)
 */
router.get('/:address/history', async (req, res) => {
    try {
        const { address } = req.params;
        let hours = parseInt(req.query.hours) || 24;

        // Cap at 7 days (168 hours)
        if (hours > 168) hours = 168;
        if (hours < 1) hours = 1;

        const history = await queries.getPoolHistory(address, hours);

        if (history.length === 0) {
            return res.json({
                address,
                period: `${hours}h`,
                history: [],
                message: 'No historical data available yet. Data collection started recently.'
            });
        }

        res.json({
            address,
            period: `${hours}h`,
            dataPoints: history.length,
            history: history.map(h => ({
                apy: parseFloat(h.apy),
                tvl: parseFloat(h.tvl),
                volume24h: parseFloat(h.volume_24h),
                fee24h: parseFloat(h.fee_24h),
                timestamp: h.timestamp
            }))
        });
    } catch (error) {
        logger.error('Error fetching history', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

/**
 * GET /api/compare - Compare multiple pools
 * Query params:
 *   - pools: Comma-separated pool addresses (max 5)
 * Example: /api/compare?pools=0x123...,0x456...,0x789...
 */
router.get('/compare', async (req, res) => {
    try {
        const poolsParam = req.query.pools;

        if (!poolsParam) {
            return res.status(400).json({
                error: 'Missing pools parameter',
                example: '/api/compare?pools=0x123...,0x456...'
            });
        }

        // Parse and validate addresses
        const addresses = poolsParam.split(',')
            .map(addr => addr.trim().toLowerCase())
            .filter(addr => addr.length === 42 && addr.startsWith('0x'))
            .slice(0, 5); // Max 5 pools

        if (addresses.length === 0) {
            return res.status(400).json({
                error: 'No valid pool addresses provided',
                example: '/api/compare?pools=0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640,0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8'
            });
        }

        logger.info('Comparing pools', { addresses, count: addresses.length });

        // Fetch data for all pools
        const poolsData = await Promise.all(
            addresses.map(addr => queries.getPoolByAddress(addr))
        );

        // Filter out nulls (pools not found)
        const validPools = poolsData.filter(p => p !== null && p !== undefined);

        if (validPools.length === 0) {
            return res.status(404).json({
                error: 'None of the requested pools were found',
                requestedAddresses: addresses
            });
        }

        // Fetch 24h history for each pool for comparison chart
        const historicalData = await Promise.all(
            validPools.map(async (pool) => {
                const history = await queries.getPoolHistory(pool.pool_address, 24);
                return {
                    address: pool.pool_address,
                    pair: `${pool.token0}/${pool.token1}`,
                    history: history.map(h => ({
                        timestamp: h.timestamp,
                        apy: parseFloat(h.apy)
                    }))
                };
            })
        );

        res.json({
            comparison: validPools.map(p => ({
                address: p.pool_address,
                pair: `${p.token0}/${p.token1}`,
                feeTier: p.fee_tier,
                apy: parseFloat(p.apy) || 0,
                tvl: parseFloat(p.tvl) || 0,
                volume24h: parseFloat(p.volume_24h) || 0,
                fee24h: parseFloat(p.fee_24h) || 0,
                lastUpdated: p.timestamp
            })),
            historicalData,
            comparedCount: validPools.length,
            requestedCount: addresses.length
        });

    } catch (error) {
        logger.error('Error in comparison', { error: error.message });
        res.status(500).json({ error: 'Failed to compare pools' });
    }
});

/**
 * POST /api/pools/refresh - Manual refresh (for testing)
 */
router.post('/refresh', async (req, res) => {
    try {
        const { manualRefresh } = require('../services/dataRefresher');
        const io = req.app.get('io');

        // Don't await - let it run in background
        manualRefresh(io);

        res.json({
            message: 'Refresh started',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error triggering refresh', { error: error.message });
        res.status(500).json({ error: 'Failed to trigger refresh' });
    }
});

/**
 * POST /api/pools/discover - Manually trigger pool discovery
 */
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