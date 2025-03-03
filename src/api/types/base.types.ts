/**
 * Types de base pour les requêtes et réponses API
 */

// Type générique pour la réponse API
export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message: string;
  success: boolean;
}

// Type pour les erreurs API
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

// Type pour les options de requête API
export interface ApiRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, string>;
} 