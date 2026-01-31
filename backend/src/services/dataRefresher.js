// const cron = require('node-cron');
// const { fetchPoolData, fetchPool24hData } = require('./uniswapFetcher');
// const { calculateAPY } = require('./apyCalculator');
// const queries = require('../models/queries');
// const logger = require('../utils/logger');
//
// // Pool addresses we're tracking
// const TRACKED_POOLS = [
//     '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', // USDC/WETH 0.05%
//     '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8', // USDC/USDT 0.01%
//     '0x3416cf6c708da44db2624d63ea0aaef7113527c6', // USDC/USDT 0.05%
//     '0x7858e59e0c01ea06df3af3d20ac7b0003275d4bf'  // USDC/USDT 0.3%
// ];
//
// async function refreshPoolData(io) {
//     logger.info('Starting pool data refresh...');
//
//     try {
//         // Fetch current pool data from The Graph
//         const poolsData = await fetchPoolData(TRACKED_POOLS);
//
//         for (const poolData of poolsData) {
//             try {
//                 // Get 24h historical data for accurate APY
//                 const dayData = await fetchPool24hData(poolData.poolAddress);
//
//                 if (!dayData) {
//                     logger.warn('No 24h data available', { pool: poolData.poolAddress });
//                     continue;
//                 }
//
//                 // Calculate APY
//                 const apy = calculateAPY(dayData.fee24h, dayData.tvl);
//
//                 // Update pool in database
//                 const poolId = await queries.upsertPool({
//                     poolAddress: poolData.poolAddress,
//                     token0: poolData.token0,
//                     token1: poolData.token1,
//                     feeTier: poolData.feeTier,
//                     tvl: dayData.tvl
//                 });
//
//                 // Insert APY snapshot
//                 await queries.insertAPYSnapshot(poolId, {
//                     apy,
//                     fee24h: dayData.fee24h,
//                     tvl: dayData.tvl,
//                     volume24h: dayData.volume24h
//                 });
//
//                 logger.info('Pool updated', {
//                     pool: poolData.poolAddress,
//                     pair: `${poolData.token0}/${poolData.token1}`,
//                     apy: apy.toFixed(2) + '%',
//                     tvl: `$${(dayData.tvl / 1000000).toFixed(2)}M`
//                 });
//
//                 // Broadcast update via WebSocket
//                 if (io) {
//                     io.to(`pool:${poolData.poolAddress}`).emit('apy_update', {
//                         poolAddress: poolData.poolAddress,
//                         apy,
//                         tvl: dayData.tvl,
//                         fee24h: dayData.fee24h,
//                         volume24h: dayData.volume24h,
//                         timestamp: new Date().toISOString()
//                     });
//                 }
//
//                 // Small delay to avoid rate limiting
//                 await new Promise(resolve => setTimeout(resolve, 500));
//
//             } catch (error) {
//                 logger.error('Error processing pool', {
//                     pool: poolData.poolAddress,
//                     error: error.message
//                 });
//             }
//         }
//
//         logger.info('Pool data refresh completed');
//
//     } catch (error) {
//         logger.error('Error in refresh cycle', { error: error.message });
//     }
// }
//
// // Start cron job (runs every 2 minutes)
// function startDataRefresher(io) {
//     logger.info('Starting data refresher cron job (every 2 minutes)...');
//
//     // Run immediately on startup
//     refreshPoolData(io);
//
//     // Then run every 2 minutes
//     cron.schedule('*/2 * * * *', () => {
//         refreshPoolData(io);
//     });
// }
//
// // Manual refresh function (for testing)
// async function manualRefresh(io) {
//     return refreshPoolData(io);
// }
//
// module.exports = {
//     startDataRefresher,
//     manualRefresh
// };

const cron = require('node-cron');
const { getMultiplePoolsData } = require('./graphClient');
const { calculateAPY } = require('./apyCalculator');
const queries = require('../models/queries');
const logger = require('../utils/logger');
const { DISCOVERY } = require('../config/constants');

/**
 * Get list of pools to track (from database, not hardcoded)
 */
async function getTrackedPools() {
    try {
        const pools = await queries.getAllPools();
        return pools.map(p => p.pool_address);
    } catch (error) {
        logger.error('Failed to get tracked pools from DB', { error: error.message });
        return [];
    }
}

async function refreshPoolData(io) {
    logger.info('Starting pool data refresh...');

    try {
        // Get pools dynamically from database
        const trackedPools = await getTrackedPools();

        if (trackedPools.length === 0) {
            logger.warn('No pools to track. Run pool discovery first.');
            return;
        }

        logger.info(`🔄 Refreshing ${trackedPools.length} pools...`);

        // Fetch REAL data from The Graph
        const poolsData = await getMultiplePoolsData(trackedPools);

        for (const poolData of poolsData) {
            try {
                // Calculate APY using REAL fees and TVL
                const apy = calculateAPY(poolData.fee24h, poolData.tvl);

                // Update pool in database
                const poolId = await queries.upsertPool({
                    poolAddress: poolData.poolAddress,
                    token0: poolData.token0,
                    token1: poolData.token1,
                    feeTier: poolData.feeTier,
                    tvl: poolData.tvl
                });

                // Insert APY snapshot with REAL data
                await queries.insertAPYSnapshot(poolId, {
                    apy,
                    fee24h: poolData.fee24h,
                    tvl: poolData.tvl,
                    volume24h: poolData.volume24h
                });

                logger.info('✅ Pool updated', {
                    pool: poolData.poolAddress,
                    pair: `${poolData.token0}/${poolData.token1}`,
                    apy: apy.toFixed(2) + '%',
                    tvl: `$${(poolData.tvl / 1000000).toFixed(2)}M`
                });

                // Broadcast update via WebSocket
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

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (error) {
                logger.error('Error processing pool', {
                    pool: poolData.poolAddress,
                    error: error.message
                });
            }
        }

        logger.info(`✅ Refresh completed - ${poolsData.length}/${trackedPools.length} pools updated`);

    } catch (error) {
        logger.error('Error in refresh cycle', { error: error.message });
    }
}
// Start cron job (runs every 2 minutes)
function startDataRefresher(io) {
    logger.info('Starting data refresher cron job (every 2 minutes)...');

    // Run immediately on startup
    refreshPoolData(io);

    // Then run every 2 minutes
    cron.schedule('*/2 * * * *', () => {
        refreshPoolData(io);
    });
}

// Manual refresh function (for testing)
async function manualRefresh(io) {
    return refreshPoolData(io);
}

module.exports = {
    startDataRefresher,
    manualRefresh
};