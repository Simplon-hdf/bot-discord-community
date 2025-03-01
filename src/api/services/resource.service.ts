import { ApiService } from './api.service';
import { ResourceCreateDto, ResourceDto, ResourceStatus } from '../types/resource.types';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Service pour interagir avec l'API des ressources
 */
export class ResourceApiService {
  private static instance: ResourceApiService;
  private apiService: ApiService;
  private readonly endpoint = 'resources';

  private constructor() {
    this.apiService = ApiService.getInstance();
  }

  /**
   * Obtient l'instance unique du service (Singleton)
   */
  public static getInstance(): ResourceApiService {
    if (!ResourceApiService.instance) {
      ResourceApiService.instance = new ResourceApiService();
    }
    return ResourceApiService.instance;
  }

  /**
   * Récupère toutes les ressources
   */
  public async getAllResources(): Promise<ResourceDto[]> {
    try {
      const response = await this.apiService.get<ResourceDto[]>(this.endpoint);
      return response.data;
    } catch (error) {
      logError('Get All Resources', error);
      return [];
    }
  }

  /**
   * Récupère une ressource par son ID
   */
  public async getResourceById(uuidResource: string): Promise<ResourceDto | null> {
    try {
      const response = await this.apiService.get<ResourceDto>(`${this.endpoint}/${uuidResource}`);
      return response.data;
    } catch (error) {
      // Si l'erreur est 404, la ressource n'existe pas
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      logError('Get Resource By Id', error);
      return null;
    }
  }

  /**
   * Crée une nouvelle ressource
   */
  public async createResource(data: ResourceCreateDto): Promise<ResourceDto | null> {
    try {
      logDebug('Create Resource', { data });
      const response = await this.apiService.post<ResourceDto>(this.endpoint, data);
      return response.data;
    } catch (error) {
      logError('Create Resource', error);
      throw error;
    }
  }

  /**
   * Méthode simplifiée pour créer une ressource avec les champs essentiels
   */
  public async createSimpleResource(
    uuidMember: string, 
    title: string, 
    description: string, 
    content: string,
    tagUuids: string[] = []
  ): Promise<ResourceDto | null> {
    const resourceData: ResourceCreateDto = {
      uuidMember,
      title,
      description,
      content,
      status: ResourceStatus.ACTIVE,
      tagUuids: tagUuids
    };
    
    return this.createResource(resourceData);
  }
} 