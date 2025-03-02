import { User } from 'discord.js';

/**
 * Représente les données d'une ressource
 */
export interface ResourceData {
  id?: string;
  title: string;
  description: string;
  content: string;
  authorId: string;
  authorName?: string;
  color?: string;
  messageId?: string;
  channelId?: string;
  guildId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Données en cours d'édition pour une ressource
 */
export interface ResourceFormData {
  title?: string;
  description?: string;
  content?: string;
  userId?: string;
  color?: string;
  selectedTags?: string[];
  timestamp?: string;
}

/**
 * Interface publique du service de ressources
 */
export interface IResourceService {
  createResource(
    client: any, 
    title: string, 
    description: string, 
    content: string,
    author: User,
    tagIds: string[],
    color?: string
  ): Promise<string | null>;
} 