import { TagApiService } from '../../api/services/tag.service';
import { TagDto } from '../../api/types/tag.types';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Service pour gérer les tags dans le bot Discord
 */
export class TagService {
  private static instance: TagService;
  private tagApiService: TagApiService;
  private cachedTags: TagDto[] = [];
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

  private constructor() {
    this.tagApiService = TagApiService.getInstance();
  }

  /**
   * Obtient l'instance unique du service (Singleton)
   */
  public static getInstance(): TagService {
    if (!TagService.instance) {
      TagService.instance = new TagService();
    }
    return TagService.instance;
  }

  /**
   * Récupère tous les tags disponibles avec mise en cache
   */
  public async getAllTags(): Promise<TagDto[]> {
    const now = Date.now();
    
    // Si le cache est expiré ou vide, rafraîchir les données
    if (now - this.lastFetchTime > this.CACHE_DURATION || this.cachedTags.length === 0) {
      try {
        const tags = await this.tagApiService.getAllTags();
        if (tags.length > 0) {
          this.cachedTags = tags;
          this.lastFetchTime = now;
          logDebug('Tag Service', `Tags récupérés avec succès: ${tags.length} tags`);
        }
      } catch (error) {
        logError('Tag Service - Get All Tags', error);
        // Si l'API échoue et que nous avons des tags en cache, utilisez-les
        if (this.cachedTags.length === 0) {
          return [];
        }
      }
    }
    
    return this.cachedTags;
  }

  /**
   * Trouve un tag par son nom ou sa description (recherche approximative)
   */
  public async findTagsByQuery(query: string): Promise<TagDto[]> {
    const tags = await this.getAllTags();
    if (!query || query.trim() === '') {
      return tags;
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(normalizedQuery) || 
      (tag.description && tag.description.toLowerCase().includes(normalizedQuery))
    );
  }

  /**
   * Crée un nouveau tag
   */
  public async createTag(name: string, description?: string): Promise<TagDto | null> {
    try {
      const newTag = await this.tagApiService.createTag({ name, description });
      
      // Mettre à jour le cache si le tag est créé avec succès
      if (newTag) {
        // Ajouter au début pour qu'il soit plus facilement sélectionnable par l'utilisateur
        this.cachedTags = [newTag, ...this.cachedTags];
      }
      
      return newTag;
    } catch (error) {
      logError('Tag Service - Create Tag', error);
      return null;
    }
  }

  /**
   * Obtient un tag par son UUID
   */
  public async getTagById(uuid: string): Promise<TagDto | null> {
    // D'abord, chercher dans le cache
    const cachedTag = this.cachedTags.find(tag => tag.uuid === uuid);
    if (cachedTag) {
      return cachedTag;
    }
    
    // Si ce n'est pas dans le cache, interroger l'API
    try {
      return await this.tagApiService.getTagById(uuid);
    } catch (error) {
      logError('Tag Service - Get Tag By Id', error);
      return null;
    }
  }

  /**
   * Convertit un tableau d'IDs de tags en un tableau de noms de tags
   */
  public async getTagNamesByIds(uuids: string[]): Promise<string[]> {
    if (!uuids || uuids.length === 0) {
      return [];
    }
    
    const tags = await this.getAllTags();
    return uuids
      .map(uuid => tags.find(tag => tag.uuid === uuid))
      .filter(tag => tag !== undefined)
      .map(tag => tag.name);
  }
} 