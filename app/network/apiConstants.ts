
  // API Configuration
  export const API_CONFIG = {
    baseURL: process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true,
  } as const;

  // API Endpoints
  export const ENDPOINTS = {
    nearby: '/api/stations/nearby',
    byLocation: '/api/stations/by-location',
    info: '/api/info/types',
    sysversions: '/api/info/sysversions',
  } as const;

  // API Error Messages
  export const ERROR_MESSAGES = {
    connection: 'Could not connect to the server. Please make sure the backend is running.',
    fetchFailed: 'Failed to fetch stations',
  } as const;



