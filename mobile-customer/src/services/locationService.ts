import * as Location from 'expo-location';
import { reverseGeocodeAddressApi } from '../api';

export interface LocationResult {
  address: string;
  pincode?: string;
  latitude: number;
  longitude: number;
}

/**
 * Request device location permissions and fetch exact GPS coordinates (<5-10m).
 * Reverse geocodes the coordinates via backend /locations/address API (with native fallback).
 */
export async function getCurrentAddressFromGPS(): Promise<LocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access location was denied. Please allow location access in your device settings.');
  }

  // Use High accuracy (satellite GPS chip) with fallback for indoor/weak signal
  let location: Location.LocationObject;
  try {
    location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
    });
  } catch {
    location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  }

  const { latitude, longitude } = location.coords;

  // 1. Try backend reverse geocode endpoint (Pelias + OSM Nominatim with exact PIN code)
  try {
    const res: any = await reverseGeocodeAddressApi(latitude, longitude);
    if (res && res.address && res.address !== 'Address not found') {
      const fullAddress = res.pincode && !res.address.includes(res.pincode)
        ? `${res.address}, ${res.pincode}`
        : res.address;

      return {
        address: fullAddress,
        pincode: res.pincode,
        latitude,
        longitude,
      };
    }
  } catch (err) {
    console.log('Backend reverse geocoding fallback triggered:', err);
  }

  // 2. Fallback to Expo Location native geocoding (Apple Maps / Google Play Services)
  try {
    const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geo) {
      const parts = [
        geo.name,
        geo.street,
        geo.district || geo.subregion,
        geo.city,
        geo.postalCode,
      ].filter(Boolean);

      return {
        address: parts.join(', ') || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
        pincode: geo.postalCode || undefined,
        latitude,
        longitude,
      };
    }
  } catch (err) {
    console.log('Native reverse geocoding error:', err);
  }

  // 3. Final coordinate string fallback
  return {
    address: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    latitude,
    longitude,
  };
}
