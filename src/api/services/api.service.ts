import { CONFIG } from '../../config';
import { ApiRequestOptions, ApiResponse } from '../types/base.types';
import { logError, logDebug } from '../../utils/error.utils';

/**
 * Service générique pour effectuer des appels API
 */
export class ApiService {
  private static instance: ApiService;
  private baseUrl: string;
  private defaultTimeout: number;

  private constructor() {
    this.baseUrl = CONFIG.api.baseUrl;
    this.defaultTimeout = CONFIG.api.timeout;
  }

  /**
   * Obtient l'instance unique du service API (Singleton)
   */
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Effectue une requête GET
   */
  public async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, null, options);
  }

  /**
   * Effectue une requête POST
   */
  public async post<T>(endpoint: string, data: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  /**
   * Effectue une requête PUT
   */
  public async put<T>(endpoint: string, data: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  /**
   * Effectue une requête DELETE
   */
  public async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, null, options);
  }

  /**
   * Méthode générique pour effectuer des requêtes HTTP
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    const timeout = options?.timeout || this.defaultTimeout;

    try {
      logDebug('API Request', { 
        method, 
        url, 
        data,
        headers: options?.headers,
        params: options?.params
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const headers = {
        'Content-Type': 'application/json',
        ...options?.headers,
      };

      // Construire les paramètres de requête
      const queryParams = options?.params 
        ? '?' + new URLSearchParams(options.params).toString() 
        : '';

      const fetchOptions = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      };
      
      logDebug('API Fetch Options', {
        url: `${url}${queryParams}`,
        ...fetchOptions,
        body: data ? JSON.stringify(data) : undefined
      });

      const response = await fetch(`${url}${queryParams}`, fetchOptions);

      clearTimeout(timeoutId);
      
      const responseData = await response.json();
      
      logDebug('API Response', {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        responseData
      });
      
      if (!response.ok) {
        logError('API Error', {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          error: responseData,
        });
        
        const errorMessage = responseData.message || 'Unknown error';
        throw new Error(`API Error (${response.status}): ${errorMessage}`);
      }

      return responseData as ApiResponse<T>;
    } catch (error) {
      logError('API Request Failed', { 
        method, 
        url,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      throw error;
    }
  }
} 