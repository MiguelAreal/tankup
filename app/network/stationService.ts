import { Posto } from '../../types/models/Posto';
import { LocationSearchParams, NearbySearchParams } from '../interfaces/apiReqParams';
import apiClient from './apiClient';
import { ENDPOINTS } from './apiConstants';

/**
 * Procura postos próximos baseados em coordenadas do utilizador.
 * Usa retry agressivo (3x) pois são dados críticos.
 */
export const fetchNearbyStations = async (params: NearbySearchParams): Promise<Posto[]> => {
  // sortBy default se não fornecido
  const requestParams = {
    ...params,
    sortBy: params.sortBy || 'mais_barato'
  };

  const response = await apiClient.get<Posto[]>(ENDPOINTS.nearby, {
    params: requestParams,
    retry: 3,
    retryDelay: 1000
  });
  
  return response.data;
};

/**
 * Procura postos por localização real (Distrito/Município).
 */
export const fetchStationsByLocation = async (params: LocationSearchParams): Promise<Posto[]> => {
  const response = await apiClient.get<Posto[]>(ENDPOINTS.byLocation, {
    params
  });

  return response.data;
};


export const StationService = {
  getNearby: fetchNearbyStations,
  getByLocation: fetchStationsByLocation
};