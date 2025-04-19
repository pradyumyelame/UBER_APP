const rideService = require('../services/ride.service');
const Ride = require('../models/ride.model');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

// Utility to generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports = {
    // Create a new ride
    createRide: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { pickup, destination, vehicleType } = req.body;
            const user = req.user._id;  // Assuming user is already attached to req from auth middleware

            // Get coordinates for the pickup and destination
            const originCoords = await rideService.getAddressCoordinate(pickup);
            const destCoords = await rideService.getAddressCoordinate(destination);

            // Get distance and duration for the ride
            const { distance_meters, duration_seconds } = await rideService.getDistanceTime(originCoords, destCoords);

            // Calculate fare based on distance and vehicle type
            const fare = rideService.calculateFare(vehicleType, distance_meters);

            // Generate OTP for the ride
            const otp = generateOtp();

            // Save the ride details into the database
            const ride = await rideService.createRide({
                user,
                pickup,
                destination,
                fare,
                status: 'pending',
                duration: duration_seconds,
                distance: distance_meters,
                otp,
                originCoords,
                destCoords,
            });

            return res.status(201).json({ success: true, ride });
        } catch (err) {
            console.error('Error creating ride:', err.message);
            return res.status(500).json({ error: err.message });
        }
    },

    // Get fare calculation without creating a ride
    getFare: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { pickup, destination, vehicleType } = req.query;

            const originCoords = await rideService.getAddressCoordinate(pickup);
            const destCoords = await rideService.getAddressCoordinate(destination);

            const { distance_meters, duration_seconds } = await rideService.getDistanceTime(originCoords, destCoords);

            // Calculate the fare based on vehicle type and distance
            const fare = rideService.calculateFare(vehicleType, distance_meters);

            return res.json({ success: true, fare });
        } catch (err) {
            console.error('Error calculating fare:', err.message);
            return res.status(500).json({ error: err.message });
        }
    },

    // Confirm ride by assigning a captain (driver)
    confirmRide: async (req, res) => {
        const { rideId } = req.body;

        // Ensure captain is available in the request
        if (!req.captain || !req.captain._id) {
            return res.status(401).json({ error: 'Unauthorized: Captain not authenticated or invalid captain' });
        }

        const captainId = req.captain._id;

        try {
            // Check if the ride exists and update it with the captain's information
            const ride = await Ride.findByIdAndUpdate(
                rideId,
                { status: 'accepted', captain: captainId },
                { new: true }
            );

            if (!ride) return res.status(404).json({ error: 'Ride not found' });

            return res.json({ success: true, ride });
        } catch (err) {
            console.error('Error confirming ride:', err.message);
            return res.status(500).json({ error: err.message });
        }
    },

    // Start the ride after OTP validation
    startRide: async (req, res) => {
        const { rideId, otp } = req.query;

        try {
            const ride = await Ride.findById(rideId).select('+otp');
            if (!ride) return res.status(404).json({ error: 'Ride not found' });

            // Check if the OTP is valid
            if (ride.otp !== otp) {
                return res.status(403).json({ error: 'Invalid OTP' });
            }

            // Mark the ride as ongoing
            ride.status = 'ongoing';
            await ride.save();

            return res.json({ success: true, ride });
        } catch (err) {
            console.error('Error starting ride:', err.message);
            return res.status(500).json({ error: err.message });
        }
    },

    // End the ride and mark it as completed
    endRide: async (req, res) => {
        const { rideId } = req.body;

        try {
            const ride = await Ride.findByIdAndUpdate(
                rideId,
                { status: 'completed' },
                { new: true }
            );

            if (!ride) return res.status(404).json({ error: 'Ride not found' });

            return res.json({ success: true, ride });
        } catch (err) {
            console.error('Error ending ride:', err.message);
            return res.status(500).json({ error: err.message });
        }
    },
};
