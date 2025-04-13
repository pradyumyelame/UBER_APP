const userModel = require('../models/user.models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blackListTokenModel = require('../models/blackListToken.models.js'); // Ensure this is imported
const captainModel = require('../models/captain.models.js')
module.exports.authUser = async (req, res, next) => {
    // Look for token in cookies or Authorization header
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    // Check if the token is blacklisted
    const isBlacklisted = await blackListTokenModel.findOne({ token: token });

    if (isBlacklisted) {
        return res.status(401).json({ message: 'Unauthorized: Token is blacklisted' });
    }

    try {
        // Decode and verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user associated with the token
        const user = await userModel.findById(decoded._id);

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }

        // Attach user to the request object for downstream use
        req.user = user;

        return next();
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

module.exports.authCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];


    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const isBlacklisted = await blackListTokenModel.findOne({ token: token });



    if (isBlacklisted) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const captain = await captainModel.findById(decoded._id)
        req.captain = captain;

        return next()
    } catch (err) {
        console.log(err);

        res.status(401).json({ message: 'Unauthorized' });
    }
}