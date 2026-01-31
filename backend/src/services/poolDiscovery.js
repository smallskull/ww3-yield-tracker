const logger = require('../utils/logger');
const queries = require('../models/queries');
const { UNISWAP_V3_SUBGRAPH } = require('../config/constants');

// Stablecoin addresses (Ethereum Mainnet)
const STABLECOINS = {
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    USDE: '0x4c9edd5852cd905f086c759e8383e09bff1e68b3', // Ethena USDe
    DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
    FRAX: '0x853d955acef822db058eb8505911ed77f175b99e',
    LUSD: '0x5f98805a4e8be255a32880fdec7f6728c6568ba0', // Liquity
    USDD: '0x0c10bf8fcb7bf5412187a595ab97a3609160b5c6', // Decentralized USD
};

// Get lowercase addresses for query
const STABLE_ADDRESSES = Object.values(STABLECOINS).map(addr => addr.toLowerCase());

/**
 * Fetch top stablecoin pools from Uniswap V3 Subgraph
 * @param {number} limit - Number of pools to fetch (default 50)
 * @returns {Array} Array of pool objects
 */
async function fetchTopStablecoinPools(limit = 50) {
    const query = `
        query GetTopStablecoinPools($stablecoins: [String!]!, $limit: Int!) {
            pools(
                first: $limit
                orderBy: totalValueLockedUSD
                orderDirection: desc
                where: {
                    or: [
                        { token0_in: $stablecoins }
                        { token1_in: $stablecoins }
                    ]
                }
            ) {
                id
                token0 {
                    id
                    symbol
                    name
                }
                token1 {
                    id
                    symbol
                    name
                }
                feeTier
                totalValueLockedUSD
                volumeUSD
                feesUSD
                liquidity
            }
        }
    `;

    try {
        const response = await fetch(UNISWAP_V3_SUBGRAPH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                variables: {
                    stablecoins: STABLE_ADDRESSES,
                    limit
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Subgraph HTTP ${response.status}`);
        }

        const { data, errors } = await response.json();

        if (errors) {
            logger.error('Subgraph GraphQL errors:', errors);
            return [];
        }

        return data?.pools || [];

    } catch (error) {
        logger.error('Failed to fetch pools from subgraph:', {
            error: error.message
        });
        return [];
    }
}

/**
 * Filter pools to ensure BOTH tokens are stablecoins
 * (Removes USDC/WETH pairs, keeps only USDC/USDT, USDC/DAI, etc.)
 * @param {Array} pools - Raw pool data
 * @returns {Array} Filtered pools
 */
function filterStablecoinPairs(pools) {
    return pools.filter(pool => {
        const token0Lower = pool.token0.id.toLowerCase();
        const token1Lower = pool.token1.id.toLowerCase();

        const token0IsStable = STABLE_ADDRESSES.includes(token0Lower);
        const token1IsStable = STABLE_ADDRESSES.includes(token1Lower);

        // Both tokens must be stablecoins
        return token0IsStable && token1IsStable;
    });
}

/**
 * Filter pools with minimum TVL threshold
 * @param {Array} pools - Pool data
 * @param {number} minTVL - Minimum TVL in USD (default $100k)
 * @returns {Array} Filtered pools
 */
function filterByTVL(pools, minTVL = 100000) {
    return pools.filter(pool => {
        const tvl = parseFloat(pool.totalValueLockedUSD);
        return tvl >= minTVL;
    });
}

/**
 * Main discovery function - finds and inserts stablecoin pools
 * @param {Object} options - Configuration options
 * @returns {Object} Results summary
 */
async function discoverStablecoinPools(options = {}) {
    const {
        limit = 50,
        minTVL = 100000,
        bothStable = true
    } = options;

    logger.info('🔍 Starting stablecoin pool discovery...', {
        limit,
        minTVL: `$${(minTVL / 1000).toFixed(0)}k`,
        bothStable
    });

    try {
        // Step 1: Fetch top pools from The Graph
        const rawPools = await fetchTopStablecoinPools(limit);
        logger.info(`📊 Fetched ${rawPools.length} pools from subgraph`);

        if (rawPools.length === 0) {
            logger.warn('No pools found from subgraph');
            return { inserted: 0, skipped: 0, errors: 0 };
        }

        // Step 2: Filter pools
        let filteredPools = rawPools;

        // Filter by TVL
        filteredPools = filterByTVL(filteredPools, minTVL);
        logger.info(`💰 After TVL filter (>$${minTVL/1000}k): ${filteredPools.length} pools`);

        // Filter to stable-stable pairs only (optional)
        if (bothStable) {
            filteredPools = filterStablecoinPairs(filteredPools);
            logger.info(`🪙 After stable-stable filter: ${filteredPools.length} pools`);
        }

        // Step 3: Insert into database
        let inserted = 0;
        let skipped = 0;
        let errors = 0;

        for (const pool of filteredPools) {
            try {
                await queries.upsertPool({
                    poolAddress: pool.id,
                    token0: pool.token0.symbol,
                    token1: pool.token1.symbol,
                    feeTier: parseInt(pool.feeTier),
                    tvl: parseFloat(pool.totalValueLockedUSD)
                });

                inserted++;
                logger.info(`✅ Added pool: ${pool.token0.symbol}/${pool.token1.symbol} (${pool.feeTier/10000}%) - TVL: $${(parseFloat(pool.totalValueLockedUSD)/1000000).toFixed(2)}M`);

            } catch (error) {
                if (error.code === '23505') { // Unique constraint violation (pool already exists)
                    skipped++;
                    logger.debug(`⏭️  Pool already exists: ${pool.id}`);
                } else {
                    errors++;
                    logger.error('Failed to insert pool', {
                        pool: pool.id,
                        error: error.message
                    });
                }
            }
        }

        const summary = {
            fetched: rawPools.length,
            filtered: filteredPools.length,
            inserted,
            skipped,
            errors
        };

        logger.info('✅ Pool discovery completed!', summary);
        return summary;

    } catch (error) {
        logger.error('Pool discovery failed:', { error: error.message });
        throw error;
    }
}

/**
 * Discover pools with USDC, USDT, USDE specifically
 * (Convenience function for your use case)
 */
async function discoverPriorityStablecoinPools() {
    return discoverStablecoinPools({
        limit: 100,        // Fetch more to ensure we get enough stable-stable pairs
        minTVL: 50000,     // Lower threshold ($50k) for more options
        bothStable: true   // Only stable-stable pairs
    });
}

module.exports = {
    discoverStablecoinPools,
    discoverPriorityStablecoinPools,
    fetchTopStablecoinPools,
    filterStablecoinPairs,
    STABLECOINS
};