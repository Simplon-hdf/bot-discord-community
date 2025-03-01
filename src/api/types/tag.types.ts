/**
 * Types pour l'API des tags
 */

// Type pour la création d'un tag
export interface TagCreateDto {
  name: string;
  description?: string;
}

// Type pour représenter un tag depuis l'API
export interface TagDto {
  uuid: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
} 