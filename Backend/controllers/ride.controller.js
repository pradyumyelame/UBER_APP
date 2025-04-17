const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');


module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, pickup, destination, vehicleType } = req.body;

    try {
        // Create the ride record
        const ride = await rideService.createRide({ user: req.user._id, pickup, destination, vehicleType });
        res.status(201).json(ride);

        // Get coordinates for pickup and destination
        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
        const destinationCoordinates = await mapService.getAddressCoordinate(destination);

        // Log coordinates to debug
        console.log('Pickup Coordinates:', pickupCoordinates);
        console.log('Destination Coordinates:', destinationCoordinates);

        // Check if coordinates were retrieved
        if (!pickupCoordinates || !destinationCoordinates) {
            return res.status(400).json({ message: 'Unable to fetch coordinates for the provided locations' });
        }

        // Call the OpenRouteService API with the coordinates
        const apiUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${process.env.ORS_API_KEY}&start=${pickupCoordinates.lng},${pickupCoordinates.lat}&end=${destinationCoordinates.lng},${destinationCoordinates.lat}`;

        // Send request to OpenRouteService (using axios or your preferred method)
        const response = await axios.get(apiUrl);

        // Handle the response as needed
        console.log('Route Response:', response.data);

        // Get Captains in Radius (assuming `pickupCoordinates` is valid)
        const captainsInRadius = await mapService.getCaptainsInTheRadius(pickupCoordinates.lat, pickupCoordinates.lng, 2);

        // Create OTP and update ride details
        ride.otp = "";

        // Populate ride with user info
        const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('user');

        // Send ride details to captains
        captainsInRadius.forEach(captain => {
            sendMessageToSocketId(captain.socketId, {
                event: 'new-ride',
                data: rideWithUser
            });
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
};


module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;

    try {
        const fare = await rideService.getFare(pickup, destination);
        return res.status(200).json(fare);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.confirmRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {

        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;

    try {
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

        console.log(ride);

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-started',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-ended',
            data: ride
        })



        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    } s
}