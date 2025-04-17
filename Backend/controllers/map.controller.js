const mapService = require('../services/maps.service');
const { validationResult } = require('express-validator');


module.exports.getCoordinates = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }


    const { address } = req.query;

    try {
        const coordinates = await mapService.getAddressCoordinate(address);
        res.status(200).json(coordinates);
    } catch (error) {
        res.status(404).json({ message: 'Coordinates not found' });
    }
}

module.exports.getDistanceTime = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { origin, destination } = req.query;

        // ✅ Step 1: Convert addresses to coordinates
        const originCoords = await mapService.getAddressCoordinate(origin);
        const destinationCoords = await mapService.getAddressCoordinate(destination);

        // ✅ Step 2: Get distance/time
        const distanceTime = await mapService.getDistanceTime(originCoords, destinationCoords);

        // ✅ Step 3: Respond with all info
        res.status(200).json({
            origin,
            destination,
            originCoords,
            destinationCoords,
            ...distanceTime
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports.getAutoCompleteSuggestions = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { input } = req.query;

    try {
        const suggestions = await mapService.getAutoCompleteSuggestions(input);
        res.status(200).json(suggestions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
