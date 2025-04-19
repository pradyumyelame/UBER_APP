const axios = require('axios');
// Assuming you have imported your captain model at the top
// const captainModel = require('../models/captain.model');

/**
 * Get coordinates for a given address
 * @param {string} address - Address to geocode
 * @returns {Object} - Object with lat and lng properties
 */
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
        console.error('Geocoding error:', err.message);
        throw new Error('Failed to fetch coordinates');
    }
};

/**
 * Get distance and time between two points
 * Function now handles both parameter styles:
 * - Four separate parameters: (startLat, startLng, endLat, endLng)
 * - Two coordinate objects: ({lat, lng}, {lat, lng})
 * @returns {Object} - Object with distance_meters and duration_seconds
 */
module.exports.getDistanceTime = async (arg1, arg2, arg3, arg4) => {
    let originCoords, destinationCoords;
    
    // Determine parameter pattern and normalize
    if (arg3 !== undefined && arg4 !== undefined) {
        // Called with individual coordinates
        originCoords = { lat: arg1, lng: arg2 };
        destinationCoords = { lat: arg3, lng: arg4 };
    } else {
        // Called with coordinate objects
        originCoords = arg1;
        destinationCoords = arg2;
    }
    
    // Validate coordinates
    if (!originCoords || !destinationCoords) {
        throw new Error('Origin and destination coordinates are required');
    }
    
    // Validate lat/lng properties exist
    if (originCoords.lat === undefined || originCoords.lng === undefined || 
        destinationCoords.lat === undefined || destinationCoords.lng === undefined) {
        console.error('Invalid coordinates provided:', { originCoords, destinationCoords });
        throw new Error('Coordinates must have valid lat and lng properties');
    }
    
    // Convert to numbers if they're strings and validate they're valid numbers
    const origLat = parseFloat(originCoords.lat);
    const origLng = parseFloat(originCoords.lng);
    const destLat = parseFloat(destinationCoords.lat);
    const destLng = parseFloat(destinationCoords.lng);
    
    if (isNaN(origLat) || isNaN(origLng) || isNaN(destLat) || isNaN(destLng)) {
        throw new Error('Coordinates must be valid numbers');
    }
    
    // Log for debugging
    console.log('Making API request with coordinates:', {
        origin: `${origLng},${origLat}`,
        destination: `${destLng},${destLat}`
    });
    
    const apiKey = process.env.ORS_API_KEY;
    const url = `https://api.openrouteservice.org/v2/directions/driving-car`;
    
    try {
        const response = await axios.get(url, {
            params: {
                api_key: apiKey,
                start: `${origLng},${origLat}`,
                end: `${destLng},${destLat}`
            }
        });
        
        // Ensure we have the correct structure in the response
        if (response.data && response.data.features && 
            response.data.features[0] && 
            response.data.features[0].properties && 
            response.data.features[0].properties.segments) {
            
            const segment = response.data.features[0].properties.segments[0];
            return {
                distance_meters: segment.distance,
                duration_seconds: segment.duration
            };
        } else {
            console.error('Unexpected API response structure:', response.data);
            throw new Error('No valid route data found in response');
        }
    } catch (err) {
        console.error('Error fetching distance/time:', err.message);
        
        // Enhanced error reporting
        if (err.response) {
            console.error('API Error Details:', {
                status: err.response.status,
                statusText: err.response.statusText,
                data: err.response.data
            });
            
            if (err.response.status === 400) {
                throw new Error('Invalid request to mapping service. Please check coordinates are valid and within service area.');
            }
        }
        
        // If no solution is found after a legitimate API call
        if (err.message.includes('No route found')) {
            throw new Error('No route found between the specified locations. They may be too far apart or not connected by roads.');
        }
        
        // Fallback handler for other errors
        throw new Error(`Failed to fetch route information: ${err.message}`);
    }
};

/**
 * Get autocomplete suggestions for an address
 * @param {string} input - Partial address input
 * @returns {Array} - Array of address suggestions
 */
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
        console.error('Autocomplete error:', err.message);
        throw new Error(`Failed to get address suggestions: ${err.message}`);
    }
};

/**
 * Find captains within a specified radius
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Radius in kilometers
 * @returns {Array} - Array of captain objects
 */
module.exports.getCaptainsInTheRadius = async (lat, lng, radius) => {
    if (!lat || !lng || !radius) {
        throw new Error('Latitude, longitude, and radius are required');
    }
    
    // Convert parameters to numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    
    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
        throw new Error('Latitude, longitude, and radius must be valid numbers');
    }
    
    try {
        // radius in km 
        const captains = await captainModel.find({
            location: {
                $geoWithin: {
                    $centerSphere: [ [ longitude, latitude ], radiusKm / 6371 ]
                }
            }
        });
        
        return captains;
    } catch (err) {
        console.error('Error finding nearby captains:', err.message);
        throw new Error(`Failed to find nearby captains: ${err.message}`);
    }
};