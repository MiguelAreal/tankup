import axios from 'axios';
import { Posto } from '../types/models';

// API Configuration
const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
} as const;

// Create an axios instance with base URL to simplify future API calls
const api = axios.create(API_CONFIG);

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
  try {
    const response = await api.get<T>(ENDPOINTS.nearby, {
      params: {
        lat,
        lng,
        radius,
        fuelType,
        sortBy,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error);
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
}

export const fetchStationsByLocation = async (params: SearchParams): Promise<Posto[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.distrito) queryParams.append('distrito', params.distrito);
    if (params.municipio) queryParams.append('municipio', params.municipio);
    if (params.fuelType) queryParams.append('fuelType', params.fuelType);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);

    const response = await api.get<Posto[]>(`${ENDPOINTS.byLocation}?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stations by location:', error);
    throw new Error(ERROR_MESSAGES.fetchFailed);
  }
};
