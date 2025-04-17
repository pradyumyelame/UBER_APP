const axios = require('axios');

module.exports.getAddressCoordinate = async (address) => {
    if (!address) {
        throw new Error('Address is required');
    }

    const apiKey = process.env.ORS_API_KEY;
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}&boundary.country=IN`;

    try {
        const response = await axios.get(url);

        if (response.data && response.data.features && response.data.features[0]) {
            const coordinates = response.data.features[0].geometry.coordinates;
            return {
                lat: coordinates[1],  // latitude
                lng: coordinates[0]   // longitude
            };
        } else {
            throw new Error('Coordinates not found for the provided address');
        }
    } catch (err) {
        console.error(err);
        throw new Error('Failed to fetch coordinates');
    }
};



// Inside getDistanceTime (mapService.js)
module.exports.getDistanceTime = async (originCoords, destinationCoords) => {
    if (!originCoords || !destinationCoords) {
        throw new Error('Origin and destination coordinates are required');
    }

    const apiKey = process.env.ORS_API_KEY;
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${originCoords.lng},${originCoords.lat}&end=${destinationCoords.lng},${destinationCoords.lat}`;

    try {
        const response = await axios.get(url);

        // Ensure we have the correct structure in the response
        if (response.data && response.data.features && response.data.features[0] && response.data.features[0].properties && response.data.features[0].properties.segments) {
            const segment = response.data.features[0].properties.segments[0];
            return {
                distance_meters: segment.distance,
                duration_seconds: segment.duration
            };
        } else {
            throw new Error('No valid route data found in response');
        }
    } catch (err) {
        console.error('Error fetching distance/time:', err.message);
        throw err;
    }
};



module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('Input is required');
    }

    const apiKey = process.env.ORS_API_KEY;
    // Adding more specific context to the query
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(input + ', India')}&boundary.country=IN`;

    try {
        const response = await axios.get(url);

        if (response.data && response.data.features) {
            return response.data.features.map(feature => feature.properties.label).filter(value => value);
        } else {
            throw new Error('Unable to fetch suggestions');
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
};



module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {

    // radius in km


    const captains = await captainModel.find({
        location: {
            $geoWithin: {
                $centerSphere: [ [ ltd, lng ], radius / 6371 ]
            }
        }
    });

    return captains;


}