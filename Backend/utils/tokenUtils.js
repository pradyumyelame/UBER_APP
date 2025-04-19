const jwt = require('jsonwebtoken');
const blackListTokenModel = require('../models/blackListToken.models.js');

// Helper function to check blacklisted token and decode it
const checkBlacklistAndDecodeToken = async (token) => {
    const isBlacklisted = await blackListTokenModel.findOne({ token: token });

    if (isBlacklisted) {
        throw new Error('Unauthorized: Token is blacklisted');
    }

    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { checkBlacklistAndDecodeToken };
