import { Linking } from 'react-native';

export const dialPhoneNumber = (phone: string) => {
  if (!phone) return;
  const cleaned = phone.replace(/[^0-9+]/g, '');
  Linking.openURL(`tel:${cleaned}`).catch((err) => {
    console.warn('Could not initiate phone call:', err);
  });
};
