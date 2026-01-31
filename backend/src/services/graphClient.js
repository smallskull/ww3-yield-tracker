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
 * Fetch multiple pools at once
 */
async function getMultiplePoolsData(poolAddresses) {
    const results = await Promise.all(
        poolAddresses.map(addr => getPoolData(addr))
    );
    return results.filter(p => p !== null);
}

module.exports = {
    getPoolData,
    getMultiplePoolsData
};