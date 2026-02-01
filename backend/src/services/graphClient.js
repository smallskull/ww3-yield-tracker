const logger = require('../utils/logger');
const { UNISWAP_V3_SUBGRAPH } = require('../config/constants');

/**
 * Fetch real pool data from Uniswap V3 Subgraph
 */
async function getPoolData(poolAddress) {
    const query = `
        query GetPool($poolId: ID!) {
            pool(id: $poolId) {
                id
                token0 {
                    symbol
                }
                token1 {
                    symbol
                }
                feeTier
                totalValueLockedUSD
                poolDayData(first: 1, orderBy: date, orderDirection: desc) {
                    volumeUSD
                    feesUSD
                    tvlUSD
                    date
                }
            }
        }
    `;

    try {
        const response = await fetch(UNISWAP_V3_SUBGRAPH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                variables: { poolId: poolAddress.toLowerCase() }
            })
        });

        if (!response.ok) {
            throw new Error(`Graph API returned ${response.status}`);
        }

        const { data, errors } = await response.json();

        if (errors) {
            logger.error('GraphQL errors:', errors);
            return null;
        }

        if (!data?.pool) {
            logger.warn('Pool not found in subgraph:', poolAddress);
            return null;
        }

        const pool = data.pool;
        const dayData = pool.poolDayData[0];

        // Return real data!
        return {
            poolAddress: pool.id,
            token0: pool.token0.symbol,
            token1: pool.token1.symbol,
            feeTier: parseInt(pool.feeTier),
            tvl: parseFloat(pool.totalValueLockedUSD),
            volume24h: dayData ? parseFloat(dayData.volumeUSD) : 0,
            fee24h: dayData ? parseFloat(dayData.feesUSD) : 0
        };

    } catch (error) {
        logger.error('Failed to fetch from The Graph:', {
            pool: poolAddress,
            error: error.message
        });
        return null;
    }
}

/**
 * Fetch multiple pools at once with better error handling
 */
async function getMultiplePoolsData(poolAddresses) {
    const results = [];
    const errors = [];

    const batchSize = 5;
    for (let i = 0; i < poolAddresses.length; i += batchSize) {
        const batch = poolAddresses.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(
            batch.map(addr => getPoolData(addr))
        );

        batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value !== null) {
                results.push(result.value);
            } else {
                errors.push({
                    address: batch[index],
                    reason: result.reason?.message || 'Unknown error'
                });
            }
        });

        if (i + batchSize < poolAddresses.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    if (errors.length > 0) {
        logger.warn(`Failed to fetch ${errors.length} pools:`, errors.slice(0, 5).map(e => e.address));
    }

    return results;
}

module.exports = {
    getPoolData,
    getMultiplePoolsData
};