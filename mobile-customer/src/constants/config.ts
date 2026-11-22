import Constants from 'expo-constants';
import { Platform } from 'react-native';

// In development with Expo, dynamically pick machine IP or default to localhost
const debuggerHost = Constants.expoConfig?.hostUri || '';
const localIp = debuggerHost.split(':')[0] || '192.168.31.145';

export const API_BASE_URL = Platform.OS === 'android' && !debuggerHost
  ? 'http://10.0.2.2:5000/api'
  : `http://${localIp || 'localhost'}:5000/api`;

export const SOCKET_URL = Platform.OS === 'android' && !debuggerHost
  ? 'http://10.0.2.2:5000'
  : `http://${localIp || 'localhost'}:5000`;
