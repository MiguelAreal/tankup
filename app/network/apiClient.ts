import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, ERROR_MESSAGES } from './apiConstants';

const apiClient = axios.create(API_CONFIG);

// --- Interceptor de Request (Logging) ---
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Se estiver em ambiente de desenvolvimento, faz log
    if (__DEV__) { 
      console.log(`\n🌐 API Request [${config.method?.toUpperCase()}]:`, {
        url: `${config.baseURL || ''}${config.url}`,
        params: config.params,
        data: config.data,
      });
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Interceptor de Response
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`✅ API Success [${response.config.url}]:`, {
        status: response.status,
        dataLength: Array.isArray(response.data) ? response.data.length : 'Object',
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config;

    // 1. Lógica de Retry
    if (config && config.retry && config.retry > 0) {
      config.retry -= 1;
      const delay = config.retryDelay || 1000;
      
      console.log(`⚠️ Falha na requisição. Tentando novamente em ${delay}ms... (Restam: ${config.retry})`);
      
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(config);
    }

    // 2. Tratamento de Erros e Mensagens
    let finalErrorMessage = error.message;

    // Verifica se é erro de conexão ou vindo do servidor
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      finalErrorMessage = `${ERROR_MESSAGES.connection} (${API_CONFIG.baseURL})`;
    } else if (error.response) {
      finalErrorMessage = `API Error ${error.response.status}: ${error.response.statusText}`;
    } else {
      finalErrorMessage = ERROR_MESSAGES.fetchFailed;
    }

    console.error(`❌ API Error:`, finalErrorMessage);

    // Rejeita com um objeto de erro melhorado ou o original
    return Promise.reject(new Error(finalErrorMessage));
  }
);

export default apiClient;