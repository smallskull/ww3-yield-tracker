// Helper functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const formatAddress = (address) => {
    if (!address) return '';
    return address.toLowerCase();
};


module.exports = {
    sleep,
    formatAddress,
    calculateAPY
};