const axios = require('axios');
const captainModel = require('../models/captain.models');
const Ride = require('../models/ride.model');

const getAddressCoordinate = async (address) => {
    if (!address) throw new Error('Address is required');

    const apiKey = process.env.ORS_API_KEY;
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}&boundary.country=IN`;

    try {
        const response = await axios.get(url);
        const coordinates = response.data.features[0].geometry.coordinates;
        return {
            lat: coordinates[1],
            lng: coordinates[0]
        };
    } catch (err) {
        throw new Error('Failed to fetch coordinates');
    }
};

const getDistanceTime = async (originCoords, destinationCoords) => {
    const apiKey = process.env.ORS_API_KEY;

    try {
        const response = await axios.get('https://api.openrouteservice.org/v2/directions/driving-car', {
            params: {
                api_key: apiKey,
                start: `${originCoords.lng},${originCoords.lat}`,
                end: `${destinationCoords.lng},${destinationCoords.lat}`
            }
        });

        const segment = response.data.features[0].properties.segments[0];
        return {
            distance_meters: segment.distance,
            duration_seconds: segment.duration
        };
    } catch (err) {
        return {
            distance_meters: 5000,
            duration_seconds: 900
        };
    }
};

const calculateFare = (vehicleType, distance_meters) => {
    const distance_km = distance_meters / 1000; // convert to km
    const baseFare = {
        auto: 30,
        car: 50,
        moto: 20
    };
    const perKmRate = {
        auto: 10,
        car: 15,
        moto: 7
    };

    return baseFare[vehicleType] + (distance_km * perKmRate[vehicleType]);
};


const getAutoCompleteSuggestions = async (input) => {
    const apiKey = process.env.ORS_API_KEY;
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(input + ', India')}&boundary.country=IN`;

    try {
        const response = await axios.get(url);
        return response.data?.features?.map(f => f.properties.label).filter(Boolean) || [];
    } catch (err) {
        throw new Error(`Failed to get address suggestions: ${err.message}`);
    }
};

const getCaptainsInTheRadius = async (lat, lng, radius) => {
    const captains = await captainModel.find({
        location: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius / 6371] // Radius in kilometers
            }
        }
    });

    return captains;
};

const createRide = async (rideData) => {
    const ride = new Ride(rideData);
    return await ride.save();
};

module.exports = {
    getAddressCoordinate,
    getDistanceTime,
    calculateFare,
    getAutoCompleteSuggestions,
    getCaptainsInTheRadius,
    createRide
};
