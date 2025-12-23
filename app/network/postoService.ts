// src/network/stationService.ts
import { StationHistoryResponse } from '@/types/models/PostoHistory';
import { Posto } from '../../types/models/Posto';
import { LocationSearchParams, NearbySearchParams } from '../interfaces/apiReqParams';
import apiClient from './apiClient';
import { ENDPOINTS } from './apiConstants';

/**
 * Procura postos próximos baseados em coordenadas do utilizador.
 */
export const fetchNearbyStations = async (params: NearbySearchParams): Promise<Posto[]> => {
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

/**
 * Obtém o histórico de preços de um posto específico.
 * @param stationId ID do posto (ex: 12455)
 * @param days Número de dias para trás (default: 30)
 */
export const fetchStationHistory = async (stationId: number, days: number = 30): Promise<StationHistoryResponse> => {
  const url = `/api/stations/${stationId}/history`;
  
  const response = await apiClient.get<StationHistoryResponse>(url, {
    params: { days }
  });

  return response.data;
};

export const StationService = {
  getNearby: fetchNearbyStations,
  getByLocation: fetchStationsByLocation,
  getHistory: fetchStationHistory
};