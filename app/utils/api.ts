import axios from 'axios';

// Cria uma instância axios com URL base para facilitar futuras chamadas
const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Enable CORS with credentials
});

/**
 * Fetch nearby stations by latitude, longitude, radius and fuel type.
 * @param lat Latitude
 * @param lng Longitude
 * @param radius Radius in meters
 * @param fuelType Selected fuel type
 * @returns Promise with stations data
 */
export async function fetchNearbyStations<T>(
  lat: number,
  lng: number,
  radius: number,
  fueltype: string,
): Promise<T> {
  try {
    const response = await api.get<T>('/api/stations/nearby', {
      params: {
        lat,
        lng,
        radius,
        fueltype,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Could not connect to the server. Please make sure the backend is running on http://localhost:3000');
    }
    throw new Error(`API error: ${error.response?.statusText || error.message}`);
  }
}

/**
 * Fetch stations by location.
 * @param district District name
 * @param county County name
 * @param fuelType fuel type filter
 * @returns Promise with stations data
 */
export async function fetchStationsByLocation<T>(
  district: string,
  county: string,
  fuelType: string,
): Promise<T> {
  try {
    const response = await api.get<T>('/api/stations', {
      params: {
        district,
        county,
        fuelType,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(`API error: ${error.response?.statusText || error.message}`);
  }
}
