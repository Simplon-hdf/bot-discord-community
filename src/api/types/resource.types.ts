/**
 * Types pour l'API des ressources
 */

// Type pour la création d'une ressource
export interface ResourceCreateDto {
  uuidMember: string;
  title: string;
  description: string;
  content: string;
  status: string;
  tagIds: string[];
}

// Type pour représenter une ressource depuis l'API
export interface ResourceDto {
  uuidResource: string;
  title: string;
  description: string;
  content: string;
  status: string;
  creatorUuid: string;
  createdAt: string;
  updatedAt: string;
  tags?: { uuid: string; name: string; description?: string }[];
}

// Statuts possibles pour une ressource
export enum ResourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
} 