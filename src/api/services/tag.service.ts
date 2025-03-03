import { ApiService } from './api.service';
import { TagCreateDto, TagDto } from '../types/tag.types';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Service pour interagir avec l'API des tags
 */
export class TagApiService {
  private static instance: TagApiService;
  private apiService: ApiService;
  private readonly endpoint = 'tags';

  private constructor() {
    this.apiService = ApiService.getInstance();
  }

  /**
   * Obtient l'instance unique du service (Singleton)
   */
  public static getInstance(): TagApiService {
    if (!TagApiService.instance) {
      TagApiService.instance = new TagApiService();
    }
    return TagApiService.instance;
  }

  /**
   * Récupère tous les tags
   */
  public async getAllTags(): Promise<TagDto[]> {
    try {
      const response = await this.apiService.get<TagDto[]>(this.endpoint);
      return response.data;
    } catch (error) {
      logError('Get All Tags', error);
      return [];
    }
  }

  /**
   * Récupère un tag par son ID
   */
  public async getTagById(uuid: string): Promise<TagDto | null> {
    try {
      const response = await this.apiService.get<TagDto>(`${this.endpoint}/${uuid}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      logError('Get Tag By Id', error);
      return null;
    }
  }

  /**
   * Crée un nouveau tag
   */
  public async createTag(data: TagCreateDto): Promise<TagDto | null> {
    try {
      logDebug('Create Tag - API Request', { 
        name: data.name, 
        description: data.description,
        endpoint: this.endpoint
      });
      
      const response = await this.apiService.post<TagDto>(this.endpoint, data);
      
      logDebug('Create Tag - API Response', { 
        success: true,
        statusCode: response.statusCode,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      logError('Create Tag - API Error', error);
      
      // Capturer et enrichir l'erreur pour un meilleur diagnostic
      if (error instanceof Error) {
        logError('Create Tag - Error Details', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      throw error;
    }
  }

  /**
   * Recherche un tag par son nom
   */
  public async findTagByName(name: string): Promise<TagDto | null> {
    try {
      const allTags = await this.getAllTags();
      return allTags.find(tag => tag.name.toLowerCase() === name.toLowerCase()) || null;
    } catch (error) {
      logError('Find Tag By Name', error);
      return null;
    }
  }

  /**
   * Récupère ou crée un tag par son nom
   */
  public async getOrCreateTag(name: string, description?: string): Promise<TagDto | null> {
    try {
      // Vérifier si le tag existe déjà
      const existingTag = await this.findTagByName(name);
      if (existingTag) {
        return existingTag;
      }

      // Sinon, créer un nouveau tag
      return await this.createTag({ name, description });
    } catch (error) {
      logError('Get Or Create Tag', error);
      return null;
    }
  }
} 