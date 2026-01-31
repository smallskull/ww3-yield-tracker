const pool = require('../config/database');
const logger = require('../utils/logger');

// Get all pools
async function getAllPools() {
    try {
        const result = await pool.query(`
            SELECT
                p.id,
                p.pool_address,
                p.token0,
                p.token1,
                p.fee_tier,
                p.tvl,
                s.apy,
                s.fee_24h,
                s.volume_24h,
                s.timestamp
            FROM pools p
                     LEFT JOIN LATERAL (
                SELECT apy, fee_24h, volume_24h, timestamp
            FROM apy_snapshots
            WHERE pool_id = p.id
            ORDER BY timestamp DESC
                LIMIT 1
                ) s ON true
            ORDER BY s.apy DESC NULLS LAST
        `);
        return result.rows;
    } catch (error) {
        logger.error('Error getting all pools', { error: error.message });
        throw error;
    }
}

// Get single pool by address
async function getPoolByAddress(poolAddress) {
    try {
        const result = await pool.query(`
            SELECT
                p.id,
                p.pool_address,
                p.token0,
                p.token1,
                p.fee_tier,
                p.tvl,
                s.apy,
                s.fee_24h,
                s.volume_24h,
                s.timestamp
            FROM pools p
                     LEFT JOIN LATERAL (
                SELECT apy, fee_24h, volume_24h, timestamp
            FROM apy_snapshots
            WHERE pool_id = p.id
            ORDER BY timestamp DESC
                LIMIT 1
                ) s ON true
            WHERE p.pool_address = $1
        `, [poolAddress.toLowerCase()]);

        return result.rows[0];
    } catch (error) {
        logger.error('Error getting pool by address', { error: error.message });
        throw error;
    }
}

// Get pool history
async function getPoolHistory(poolAddress, hours = 24) {
    try {
        const result = await pool.query(`
            SELECT
                s.apy,
                s.fee_24h,
                s.tvl,
                s.volume_24h,
                s.timestamp
            FROM apy_snapshots s
                     JOIN pools p ON s.pool_id = p.id
            WHERE p.pool_address = $1
              AND s.timestamp > NOW() - INTERVAL '${hours} hours'
            ORDER BY s.timestamp ASC
        `, [poolAddress.toLowerCase()]);

        return result.rows;
    } catch (error) {
        logger.error('Error getting pool history', { error: error.message });
        throw error;
    }
}

// Insert or update pool
async function upsertPool(poolData) {
    const { poolAddress, token0, token1, feeTier, tvl } = poolData;

    try {
        const result = await pool.query(`
            INSERT INTO pools (pool_address, token0, token1, fee_tier, tvl, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT (pool_address) 
            DO UPDATE SET
                tvl = $5,
                                   updated_at = NOW()
                                   RETURNING id
        `, [poolAddress.toLowerCase(), token0, token1, feeTier, tvl]);

        return result.rows[0].id;
    } catch (error) {
        logger.error('Error upserting pool', { error: error.message });
        throw error;
    }
}

// Insert APY snapshot
async function insertAPYSnapshot(poolId, apyData) {
    const { apy, fee24h, tvl, volume24h } = apyData;

    try {
        await pool.query(`
            INSERT INTO apy_snapshots (pool_id, apy, fee_24h, tvl, volume_24h)
            VALUES ($1, $2, $3, $4, $5)
        `, [poolId, apy, fee24h, tvl, volume24h]);
    } catch (error) {
        logger.error('Error inserting APY snapshot', { error: error.message });
        throw error;
    }
}

module.exports = {
    getAllPools,
    getPoolByAddress,
    getPoolHistory,
    upsertPool,
    insertAPYSnapshot
};