const cron = require('node-cron');
const { getMultiplePoolsData } = require('./graphClient');
const { calculateAPY } = require('./apyCalculator');
const queries = require('../models/queries');
const logger = require('../utils/logger');


async function getTrackedPools() {
    try {
        const pools = await queries.getAllPools(1000); // Get all pools, no limit
        return pools.map(p => p.pool_address);
    } catch (error) {
        logger.error('Failed to get tracked pools from DB', { error: error.message });
        return [];
    }
}

async function refreshPoolData(io) {
    logger.info('Starting pool data refresh...');

    try {
        const trackedPools = await getTrackedPools();

        if (trackedPools.length === 0) {
            logger.warn('No pools to track. Run pool discovery first.');
            return;
        }

        logger.info(`🔄 Refreshing ${trackedPools.length} pools...`);

        const poolsData = await getMultiplePoolsData(trackedPools);

        const fetchedAddresses = poolsData.map(p => p.poolAddress.toLowerCase());
        const failedPools = trackedPools.filter(addr => !fetchedAddresses.includes(addr.toLowerCase()));

        if (failedPools.length > 0) {
            logger.warn(`⚠️  Failed to fetch data for ${failedPools.length} pools:`, failedPools.slice(0, 5));
        }

        let successCount = 0;
        let errorCount = 0;

        for (const poolData of poolsData) {
            try {
                const apy = calculateAPY(poolData.fee24h, poolData.tvl);

                const poolId = await queries.upsertPool({
                    poolAddress: poolData.poolAddress,
                    token0: poolData.token0,
                    token1: poolData.token1,
                    feeTier: poolData.feeTier,
                    tvl: poolData.tvl
                });

                await queries.insertAPYSnapshot(poolId, {
                    apy,
                    fee24h: poolData.fee24h,
                    tvl: poolData.tvl,
                    volume24h: poolData.volume24h
                });

                successCount++;
                logger.info('✅ Pool updated', {
                    pool: poolData.poolAddress,
                    pair: `${poolData.token0}/${poolData.token1}`,
                    apy: apy.toFixed(2) + '%',
                    tvl: `$${(poolData.tvl / 1000000).toFixed(2)}M`
                });

                if (io) {
                    io.to(`pool:${poolData.poolAddress}`).emit('apy_update', {
                        poolAddress: poolData.poolAddress,
                        apy,
                        tvl: poolData.tvl,
                        fee24h: poolData.fee24h,
                        volume24h: poolData.volume24h,
                        timestamp: new Date().toISOString()
                    });
                }

                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (error) {
                errorCount++;
                logger.error('Error processing pool', {
                    pool: poolData.poolAddress,
                    error: error.message,
                    stack: error.stack
                });
            }
        }

        logger.info(`✅ Refresh completed - ${successCount} updated, ${errorCount} errors, ${failedPools.length} fetch failures`);

    } catch (error) {
        logger.error('Error in refresh cycle', { error: error.message, stack: error.stack });
    }
}

function startDataRefresher(io) {
    logger.info('Starting data refresher cron job (every 2 minutes)...');

    refreshPoolData(io);

    cron.schedule('*/2 * * * *', () => {
        refreshPoolData(io);
    });
}

async function manualRefresh(io) {
    return refreshPoolData(io);
}

module.exports = {
    startDataRefresher,
    manualRefresh,
    getTrackedPools
};