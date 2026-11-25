import axios from 'axios';

/**
 * Helper to calculate straight-line Haversine distance in km
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Calculate distance and ETA between two points using HeiGIT OpenRouteService Matrix API with Haversine fallback.
 * @param {Object} origin - { lat, lng }
 * @param {Object} destination - { lat, lng }
 * @returns {{ distance: string, duration: string }}
 */
export const calculateDistanceAndETA = async (origin, destination) => {
    const apiKey = process.env.ORS_API_KEY;
    const url = 'https://api.heigit.org/openrouteservice/v2/matrix/driving-car';

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
                timeout: 5000,
            }
        );

        const distanceKm = response.data?.distances?.[0]?.[1];
        const durationSec = response.data?.durations?.[0]?.[1];

        if (distanceKm !== undefined && durationSec !== undefined) {
            return {
                distance: `${distanceKm.toFixed(2)} km`,
                duration: `${Math.max(5, Math.round(durationSec / 60))} mins`,
            };
        }
    } catch (error) {
        console.error('HeiGIT Matrix Error (using fallback):', error.response?.data || error.message);
    }

    // Fail-safe Haversine estimate (~18 km/h city delivery speed)
    const approxKm = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const approxMins = Math.max(8, Math.round(approxKm * 3.3));
    return {
        distance: `${approxKm.toFixed(2)} km`,
        duration: `${approxMins} mins`,
    };
};

/**
 * @desc    Get driving route (GeoJSON polyline) between two points
 * @route   POST /api/locations/route
 */
export const getRoute = async (req, res) => {
    const { start, end } = req.body;
    const apiKey = process.env.ORS_API_KEY;
    const url = 'https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson';

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
                timeout: 7000,
            }
        );
        return res.json(response.data);
    } catch (error) {
        console.error('HeiGIT Directions Error (using fallback line):', error.response?.data || error.message);
        // Fallback straight-line GeoJSON feature so map never breaks
        return res.json({
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [start.lng, start.lat],
                        [end.lng, end.lat]
                    ]
                },
                properties: {
                    summary: {
                        distance: haversineDistance(start.lat, start.lng, end.lat, end.lng) * 1000,
                        duration: 600
                    }
                }
            }]
        });
    }
};

/**
 * @desc    Reverse geocode coordinates to a human-readable address with high-accuracy Nominatim fallback
 * @route   POST /api/locations/address
 */
export const getAddress = async (req, res) => {
    const { lat, lng } = req.body;
    const apiKey = process.env.ORS_API_KEY;

    let address = '';
    let pincode = '';

    // 1. Try HeiGIT Pelias Reverse Geocode
    if (apiKey) {
        try {
            const peliasUrl = `https://api.heigit.org/pelias/v1/reverse?api_key=${apiKey}&point.lat=${lat}&point.lon=${lng}&size=1`;
            const response = await axios.get(peliasUrl, { timeout: 4000 });
            const properties = response.data?.features?.[0]?.properties || {};
            if (properties.label) {
                address = properties.label;
            }
            if (properties.postalcode) {
                pincode = properties.postalcode;
            }
        } catch (err) {
            console.log('Pelias Geocoding error, falling back to OSM Nominatim:', err.message);
        }
    }

    // 2. Query OpenStreetMap Nominatim for exact local Indian street names and PIN codes
    if (!address || !pincode) {
        try {
            const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
            const osmResponse = await axios.get(osmUrl, {
                headers: { 'User-Agent': 'YumoraFoodDelivery/1.0 (contact@yumora.app)' },
                timeout: 4000
            });
            const osmData = osmResponse.data;
            if (osmData) {
                const addr = osmData.address || {};
                const parts = [
                    addr.amenity || addr.shop || addr.building,
                    addr.road || addr.pedestrian,
                    addr.suburb || addr.neighbourhood || addr.city_district,
                    addr.city || addr.town || addr.county,
                ].filter(Boolean);

                if (!address && parts.length > 0) {
                    address = parts.join(', ');
                } else if (!address && osmData.display_name) {
                    address = osmData.display_name;
                }

                if (!pincode && addr.postcode) {
                    pincode = addr.postcode;
                }
            }
        } catch (osmErr) {
            console.log('OSM Nominatim Geocoding error:', osmErr.message);
        }
    }

    // Fallback if neither service provided an address
    if (!address) {
        address = `Location (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`;
    }

    return res.status(200).json({
        status: 'success',
        address,
        pincode
    });
};
