import { InfoResponse } from "../interfaces/apiResponse";
import apiClient from "./apiClient";
import { ENDPOINTS } from "./apiConstants";

/**
 * Obtém metadados da API (filtros, marcas, etc).
 * Inclui headers de cache-busting.
 */
export const fetchInfo = async (): Promise<InfoResponse> => {
  const response = await apiClient.get<InfoResponse>(ENDPOINTS.info, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    params: { _ts: Date.now() }
  });

  return response.data;
};


export const InfoService = {
  getInfo: fetchInfo,
};