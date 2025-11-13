import axios from 'axios';
import Constants from 'expo-constants';

import { getStoredToken } from './authStorage';

const getBaseURL = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL
    || Constants.expoConfig?.extra?.apiUrl
    || Constants.manifest2?.extra?.apiUrl;

  if (envUrl) {
    console.log('[API] Using baseURL from env:', envUrl);
    return envUrl;
  }

  // Default fallback for local development
  console.log('[API] Using default baseURL: http://localhost:5000');
  return 'http://localhost:5000';
};

const baseURL = getBaseURL();
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await getStoredToken();

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  console.log('[API] Request:', config.method?.toUpperCase(), baseURL + config.url);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('[API] Error:', {
      status: error?.response?.status,
      url: error?.config?.url,
      message: error?.message,
    });
    return Promise.reject(error);
  }
);

export default api;









