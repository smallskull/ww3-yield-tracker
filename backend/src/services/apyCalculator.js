const logger = require('../utils/logger');

function calculateAPY(fee24h, tvl) {
    if (!tvl || tvl === 0) {
        logger.warn('TVL is zero, cannot calculate APY');
        return 0;
    }

    // APY = (24h fees / TVL) * 365 * 100
    const dailyReturn = fee24h / tvl;
    const apy = dailyReturn * 365 * 100;

    return parseFloat(apy.toFixed(4));
}

module.exports = {
    calculateAPY
};