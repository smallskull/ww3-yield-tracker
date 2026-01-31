const logger = require('../utils/logger');
const { UNISWAP_V3_SUBGRAPH } = require('../config/constants');

class UniswapV3Adapter {
    /**
     * Fetch pool data from Uniswap V3 Subgraph
     * @param {string} poolAddress - Pool contract address
     * @returns {Object|null} Pool metrics or null
     */
    async getPoolMetrics(poolAddress) {
        const query = `
      query GetPool($poolId: ID!) {
        pool(id: $poolId) {
          id
          token0 {
            id
            symbol
            decimals
          }
          token1 {
            id
            symbol
            decimals
          }
          feeTier
          liquidity
          sqrtPrice
          tick
          totalValueLockedUSD
          totalValueLockedToken0
          totalValueLockedToken1
          volumeUSD
          feesUSD
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
                throw new Error(`Subgraph HTTP ${response.status}`);
            }

            const { data, errors } = await response.json();

            if (errors) {
                logger.error('Subgraph GraphQL errors:', errors);
                return null;
            }

            if (!data?.pool) {
                logger.warn('Pool not found in subgraph:', poolAddress);
                return null;
            }

            const pool = data.pool;
            const dayData = pool.poolDayData[0];

            return {
                poolAddress: pool.id,
                token0: {
                    address: pool.token0.id,
                    symbol: pool.token0.symbol,
                    decimals: parseInt(pool.token0.decimals)
                },
                token1: {
                    address: pool.token1.id,
                    symbol: pool.token1.symbol,
                    decimals: parseInt(pool.token1.decimals)
                },
                feeTier: parseInt(pool.feeTier),
                liquidity: pool.liquidity,
                tvlUSD: parseFloat(pool.totalValueLockedUSD),
                volumeUSD: parseFloat(pool.volumeUSD),
                feesUSD: parseFloat(pool.feesUSD),
                // 24h data
                volume24hUSD: dayData ? parseFloat(dayData.volumeUSD) : 0,
                fees24hUSD: dayData ? parseFloat(dayData.feesUSD) : 0,
                tvl24hUSD: dayData ? parseFloat(dayData.tvlUSD) : parseFloat(pool.totalValueLockedUSD)
            };

        } catch (error) {
            logger.error('Failed to fetch pool from subgraph:', {
                pool: poolAddress,
                error: error.message
            });
            return null;
        }
    }

    /**
     * Fetch multiple pools at once (batch query)
     * @param {string[]} poolAddresses
     * @returns {Object[]} Array of pool metrics
     */
    async getMultiplePoolMetrics(poolAddresses) {
        const pools = await Promise.all(
            poolAddresses.map(addr => this.getPoolMetrics(addr))
        );
        return pools.filter(p => p !== null);
    }
}

module.exports = new UniswapV3Adapter();