module.exports = {
    UNISWAP_V3_SUBGRAPH: process.env.UNISWAP_V3_SUBGRAPH_URL,

    // Pool addresses we're tracking
    TRACKED_POOLS: [
        '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', // USDC/WETH 0.05%
        '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8', // USDC/USDT 0.01%
        '0x3416cf6c708da44db2624d63ea0aaef7113527c6', // USDC/USDT 0.05%
        '0x7858e59e0c01ea06df3af3d20ac7b0003275d4bf'  // USDC/USDT 0.3%
    ]
};

module.exports = {
    UNISWAP_V3_SUBGRAPH: process.env.UNISWAP_V3_SUBGRAPH_URL,

    // Pool addresses we're tracking (DEPRECATED - now auto-discovered)
    TRACKED_POOLS: [
        '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
        '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
        '0x3416cf6c708da44db2624d63ea0aaef7113527c6',
        '0x7858e59e0c01ea06df3af3d20ac7b0003275d4bf'
    ],

    // Pool discovery settings
    DISCOVERY: {
        ENABLED: process.env.POOL_DISCOVERY_ENABLED !== 'false', // Default: true
        ON_STARTUP: true,  // Run discovery on server start
        MIN_TVL: 50000,    // Minimum $50k TVL
        MAX_POOLS: 100     // Fetch up to 100 pools
    }
};