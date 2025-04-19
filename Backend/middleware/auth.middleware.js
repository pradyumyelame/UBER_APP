const userModel = require('../models/user.models');
const jwt = require('jsonwebtoken');
const blackListTokenModel = require('../models/blackListToken.models.js');
const captainModel = require('../models/captain.models.js');

// Assuming you have a Captain model
const { checkBlacklistAndDecodeToken } = require('../utils/tokenUtils.js'); // Importing the function

// User Authentication Middleware
module.exports.authUser = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = await checkBlacklistAndDecodeToken(token);

        // Log decoded token for debugging
        console.log('Decoded token:', decoded);

        // Find the user associated with the token
        const user = await userModel.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }

        req.user = user;  // Attach user to the request object
        return next();
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: err.message || 'Unauthorized: Invalid token' });
    }
};

// Captain Authentication Middleware
module.exports.authCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = await checkBlacklistAndDecodeToken(token); // Assuming this method checks the token

        const captain = await captainModel.findById(decoded._id);
        if (!captain) {
            return res.status(401).json({ message: 'Unauthorized: Captain not found' });
        }

        req.captain = captain;  // Set captain on the request object
        next();
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: err.message || 'Unauthorized: Invalid token' });
    }
};
