import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    retry?: number;
    retryDelay?: number;
  }
}