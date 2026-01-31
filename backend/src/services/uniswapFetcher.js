// const { ethers } = require('ethers');
// const logger = require('../utils/logger');
//
// // Alchemy provider
// const provider = new ethers.JsonRpcProvider(
//     `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
// );
//
// // Uniswap V3 Pool ABI (minimal - just what we need)
// const POOL_ABI = [
//     'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
//     'function liquidity() external view returns (uint128)',
//     'function token0() external view returns (address)',
//     'function token1() external view returns (address)',
//     'function fee() external view returns (uint24)'
// ];
//
// // ERC20 ABI for token info
// const ERC20_ABI = [
//     'function symbol() view returns (string)',
//     'function decimals() view returns (uint8)'
// ];
//
// // Token addresses (Mainnet)
// const TOKENS = {
//     USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
//     USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
//     WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//     DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
// };
//
// // Pool configurations
// const POOL_CONFIGS = [
//     { token0: TOKENS.USDC, token1: TOKENS.WETH, fee: 500, address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' },
//     { token0: TOKENS.USDC, token1: TOKENS.USDT, fee: 100, address: '0x3416cf6c708da44db2624d63ea0aaef7113527c6' },
//     { token0: TOKENS.USDC, token1: TOKENS.USDT, fee: 500, address: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8' },
//     { token0: TOKENS.USDT, token1: TOKENS.WETH, fee: 3000, address: '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36' }
// ];
//
// async function getTokenSymbol(tokenAddress) {
//     try {
//         const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
//         return await tokenContract.symbol();
//     } catch (error) {
//         logger.error('Error getting token symbol', { error: error.message, tokenAddress });
//         return 'UNKNOWN';
//     }
// }
//
// async function fetchPoolData(poolAddresses) {
//     const results = [];
//
//     for (const config of POOL_CONFIGS) {
//         try {
//             const poolContract = new ethers.Contract(config.address, POOL_ABI, provider);
//
//             // Get token symbols
//             const [token0Symbol, token1Symbol] = await Promise.all([
//                 getTokenSymbol(config.token0),
//                 getTokenSymbol(config.token1)
//             ]);
//
//             // Get pool state
//             const [slot0, liquidity] = await Promise.all([
//                 poolContract.slot0(),
//                 poolContract.liquidity()
//             ]);
//
//             // Estimate TVL (simplified - actual calculation is complex)
//             const tvl = Number(liquidity) / 1e18 * 2000; // Rough estimate
//
//             results.push({
//                 poolAddress: config.address,
//                 token0: token0Symbol,
//                 token1: token1Symbol,
//                 feeTier: config.fee,
//                 tvl: tvl,
//                 volume24h: tvl * 0.5,
//                 fee24h: tvl * 0.5 * (config.fee / 1000000)
//             });
//
//             logger.info('Fetched pool data', {
//                 pool: config.address,
//                 pair: `${token0Symbol}/${token1Symbol}`
//             });
//
//         } catch (error) {
//             logger.error('Error fetching pool data', {
//                 error: error.message,
//                 pool: config.address
//             });
//         }
//     }
//
//     return results;
// }
//
// async function fetchPool24hData(poolAddress) {
//     try {
//         const config = POOL_CONFIGS.find(c => c.address.toLowerCase() === poolAddress.toLowerCase());
//         if (!config) return null;
//
//         const poolContract = new ethers.Contract(config.address, POOL_ABI, provider);
//         const liquidity = await poolContract.liquidity();
//
//         const tvl = Number(liquidity) / 1e18 * 2000;
//         const volume24h = tvl * 0.5;
//         const fee24h = volume24h * (config.fee / 1000000);
//
//         return {
//             fee24h,
//             volume24h,
//             tvl
//         };
//
//     } catch (error) {
//         logger.error('Error fetching 24h data', { error: error.message, poolAddress });
//         return null;
//     }
// }
//
// module.exports = {
//     fetchPoolData,
//     fetchPool24hData
// };