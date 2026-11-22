import { Linking, Platform } from 'react-native';

export const openTurnByTurnNavigation = async (
  lat: number,
  lng: number,
  label: string = 'Destination'
) => {
  const encodedLabel = encodeURIComponent(label);
  
  if (Platform.OS === 'ios') {
    const appleMapsUrl = `maps://app?daddr=${lat},${lng}&q=${encodedLabel}`;
    const canOpen = await Linking.canOpenURL(appleMapsUrl);
    if (canOpen) {
      return Linking.openURL(appleMapsUrl);
    }
  }

  // Android navigation intent
  if (Platform.OS === 'android') {
    const googleNavUrl = `google.navigation:q=${lat},${lng}`;
    const canOpen = await Linking.canOpenURL(googleNavUrl);
    if (canOpen) {
      return Linking.openURL(googleNavUrl);
    }
  }

  // Browser / universal Google Maps fallback
  const webMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=driving`;
  return Linking.openURL(webMapsUrl);
};

export const dialPhoneNumber = (phone: string) => {
  if (!phone) return;
  const cleaned = phone.replace(/[^0-9+]/g, '');
  Linking.openURL(`tel:${cleaned}`);
};
