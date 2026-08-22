import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getItemAsync, deleteItemAsync } from '../utils/storage';

export const getBaseUrl = () => {
  // Extract host IP from Expo Go / Metro bundler
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;

  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8000/api/v1`;
    }
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
    return `http://${hostname}:8000/api/v1`;
  }

  // Default LAN machine IP for physical mobile devices running Expo Go
  return 'http://10.10.197.77:8000/api/v1';
};

const BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const TOKEN_KEY = 'tryvia_jwt_token';

// Request Interceptor: Attach JWT token if it exists
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getItemAsync(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token for request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors like 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized - clearing token');
      await deleteItemAsync(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);
