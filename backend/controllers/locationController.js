import axios from 'axios';

/**
 * Calculate distance and ETA between two points using OpenRouteService Matrix API.
 * @param {Object} origin - { lat, lng }
 * @param {Object} destination - { lat, lng }
 * @returns {{ distance: string, duration: string }}
 */
export const calculateDistanceAndETA = async (origin, destination) => {
    const apiKey = process.env.ORS_API_KEY;
    const url = 'https://api.openrouteservice.org/v2/matrix/driving-car';

    try {
        const response = await axios.post(
            url,
            {
                locations: [
                    [origin.lng, origin.lat],
                    [destination.lng, destination.lat]
                ],
                metrics: ['distance', 'duration'],
                units: 'km',
            },
            {
                headers: {
                    Authorization: apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );

        const distanceKm = response.data.distances[0][1];
        const durationSec = response.data.durations[0][1];

        return {
            distance: `${distanceKm.toFixed(2)} km`,
            duration: `${Math.round(durationSec / 60)} mins`,
        };
    } catch (error) {
        console.error('ORS Matrix Error:', error.response?.data || error.message);
        return { distance: 'N/A', duration: 'N/A' };
    }
};

/**
 * @desc    Get driving route (GeoJSON polyline) between two points
 * @route   POST /api/locations/route
 */
export const getRoute = async (req, res) => {
    const { start, end } = req.body;
    const apiKey = process.env.ORS_API_KEY;
    const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

    try {
        const response = await axios.post(
            url,
            {
                coordinates: [
                    [start.lng, start.lat],
                    [end.lng, end.lat]
                ]
            },
            {
                headers: {
                    Authorization: apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching route',
            error: error.response?.data || error.message
        });
    }
};

/**
 * @desc    Reverse geocode coordinates to a human-readable address
 * @route   POST /api/locations/address
 */
export const getAddress = async (req, res) => {
    const { lat, lng } = req.body;
    const apiKey = process.env.ORS_API_KEY;
    const url = `https://api.openrouteservice.org/geocode/reverse?api_key=${apiKey}&point.lon=${lng}&point.lat=${lat}`;

    try {
        const response = await axios.get(url);
        const address = response.data.features?.[0]?.properties?.label || 'Address not found';
        res.json({ address });
    } catch (error) {
        console.error('Geocoding Error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Error fetching address',
            error: error.response?.data || error.message
        });
    }
};
