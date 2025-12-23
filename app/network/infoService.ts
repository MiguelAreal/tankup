import { InfoResponse } from "../interfaces/apiResponse";
import apiClient from "./apiClient";
import { ENDPOINTS } from "./apiConstants";

export interface AppConfig {
  platform: 'android' | 'ios' | 'web';
  minVersion: string;
  latestVersion: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}


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

/**
 * Obtém as versões mínimas e mais recentes da aplicação.
 * @returns 
 */
export const fetchSysVersions = async (): Promise<AppConfig[]> => {
  const response = await apiClient.get<AppConfig[]>(ENDPOINTS.sysversions, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    params: { _ts: Date.now() } // Evitar cache agressiva
  });
  return response.data;
};

export const InfoService = {
  getInfo: fetchInfo,
  getSysVersions: fetchSysVersions,
};