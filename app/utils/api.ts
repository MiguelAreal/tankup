import axios, { AxiosRequestConfig } from 'axios';
import { Posto } from '../../types/models/Posto';

// Extend AxiosRequestConfig to include retry properties
interface RetryConfig extends AxiosRequestConfig {
  retry?: number;
  retryDelay?: number;
}

// API Configuration
const API_CONFIG = {
  //baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://tankup-backend.onrender.com',
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
} as const;

// Create an axios instance with base URL to simplify future API calls
const api = axios.create(API_CONFIG);

// Add retry interceptor
api.interceptors.response.use(undefined, async (err) => {
  const { config } = err;
  if (!config) {
    return Promise.reject(err);
  }
  const retryConfig = config as RetryConfig;
  if (!retryConfig.retry) {
    return Promise.reject(err);
  }
  retryConfig.retry -= 1;
  const delayRetry = new Promise(resolve => {
    setTimeout(resolve, retryConfig.retryDelay || 1000);
  });
  await delayRetry;
  return api(config);
});

// API Endpoints
const ENDPOINTS = {
  nearby: '/api/stations/nearby',
  byLocation: '/api/stations/by-location',
} as const;

// API Error Messages
const ERROR_MESSAGES = {
  connection: 'Could not connect to the server. Please make sure the backend is running.',
  fetchFailed: 'Failed to fetch stations',
} as const;

// Logger function for API calls
const logApiCall = (endpoint: string, params: any) => {
  console.log('\n🌐 API Call:', {
    endpoint,
    params,
    timestamp: new Date().toISOString()
  });
};

/**
 * Fetch nearby stations by latitude, longitude, radius and fuel type.
 * @param lat Latitude
 * @param lng Longitude
 * @param radius Radius in meters
 * @param fuelType Selected fuel type
 * @param sortBy Sorting option
 * @returns Promise with stations data
 */
export async function fetchNearbyStations<T>(
  lat: number,
  lng: number,
  radius: number,
  fuelType: string,
  sortBy: 'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto' = 'mais_barato',
): Promise<T> {
  const params = { lat, lng, radius, fuelType, sortBy };
  logApiCall(ENDPOINTS.nearby, params);
  
  try {
    const response = await api.get<T>(ENDPOINTS.nearby, { 
      params,
      retry: 3,
      retryDelay: 1000
    } as RetryConfig);
    console.log('✅ API Response:', {
      endpoint: ENDPOINTS.nearby,
      status: response.status,
      resultsCount: Array.isArray(response.data) ? response.data.length : 'N/A'
    });
    return response.data;
  } catch (error: any) {
    console.log('❌ API Error:', {
      endpoint: ENDPOINTS.nearby,
      error: error.code === 'ECONNREFUSED' 
        ? `${ERROR_MESSAGES.connection} ${API_CONFIG.baseURL}`
        : `API error: ${error.response?.statusText || error.message}`
    });
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`${ERROR_MESSAGES.connection} ${API_CONFIG.baseURL}`);
    }
    throw new Error(`API error: ${error.response?.statusText || error.message}`);
  }
}

export interface SearchParams {
  distrito?: string;
  municipio?: string;
  fuelType?: string;
  sortBy?: 'mais_caro' | 'mais_barato';
  radius?: number;
}

export const fetchStationsByLocation = async (params: SearchParams): Promise<Posto[]> => {
  logApiCall(ENDPOINTS.byLocation, params);
  
  try {
    const queryParams = new URLSearchParams();
    if (params.distrito) queryParams.append('distrito', params.distrito);
    if (params.municipio) queryParams.append('municipio', params.municipio);
    if (params.fuelType) queryParams.append('fuelType', params.fuelType);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);

    const response = await api.get<Posto[]>(`${ENDPOINTS.byLocation}?${queryParams.toString()}`);
    console.log('✅ API Response:', {
      endpoint: ENDPOINTS.byLocation,
      status: response.status,
      resultsCount: response.data.length
    });
    return response.data;
  } catch (error: any) {
    console.log('❌ API Error:', {
      endpoint: ENDPOINTS.byLocation,
      error: error.code === 'ECONNREFUSED'
        ? `${ERROR_MESSAGES.connection} ${API_CONFIG.baseURL}`
        : `API error: ${error.response?.statusText || error.message}`
    });
    throw error;
  }
};

const apiUtils = {
  fetchNearbyStations,
  fetchStationsByLocation,
  api,
  ENDPOINTS,
  ERROR_MESSAGES,
};

export default apiUtils;
