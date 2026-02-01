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
        ENABLED: process.env.POOL_DISCOVERY_ENABLED !== 'false',
        ON_STARTUP: true,
        MIN_TVL: 10000,
        MAX_POOLS: 200
    }
};