import { ApiService } from './api.service';
import { logDebug, logError } from '../../utils/error.utils';
import { GuildCreateDto, GuildDto } from '../types/guild.types';
import { CONFIG } from '../../config';

/**
 * Service pour interagir avec l'API des guilds
 */
export class GuildApiService {
  private static instance: GuildApiService;
  private apiService: ApiService;
  private readonly endpoint = 'guilds';

  private constructor() {
    this.apiService = ApiService.getInstance();
  }

  /**
   * Obtient l'instance unique du service
   */
  public static getInstance(): GuildApiService {
    if (!GuildApiService.instance) {
      GuildApiService.instance = new GuildApiService();
    }
    return GuildApiService.instance;
  }

  /**
   * Récupère une guild par son ID Discord
   * @param uuidGuild ID Discord de la guild
   * @returns La guild si trouvée, null sinon
   */
  public async getGuildById(uuidGuild: string): Promise<GuildDto | null> {
    try {
      logDebug('Getting Guild by ID', { uuidGuild });
      const response = await this.apiService.get<GuildDto>(`${this.endpoint}/${uuidGuild}`);
      return response.data;
    } catch (error: any) {
      if (error.message && error.message.includes('404')) {
        logDebug('Guild not found', { uuidGuild });
        return null;
      }
      logError('Get guild error', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle guild
   * @param uuidGuild ID Discord de la guild
   * @param name Nom de la guild
   * @param memberCount Nombre de membres dans la guild
   * @param configuration Configuration de la guild (optionnel)
   * @returns La guild créée
   */
  public async createGuild(
    uuidGuild: string, 
    name: string,
    memberCount: string,
    configuration?: Record<string, any>
  ): Promise<GuildDto> {
    try {
      logDebug('Creating Guild', { uuidGuild, name, memberCount });
      
      const guildData: GuildCreateDto = {
        uuid: uuidGuild,
        name,
        memberCount,
        configuration: configuration || {}
      };
      
      const response = await this.apiService.post<GuildDto>(this.endpoint, guildData);
      
      logDebug('Guild created successfully', { uuidGuild });
      return response.data;
    } catch (error) {
      logError('Create guild error', error);
      throw error;
    }
  }

  /**
   * Récupère une guild ou la crée si elle n'existe pas
   * @param uuidGuild ID Discord de la guild
   * @param name Nom de la guild
   * @param memberCount Nombre de membres dans la guild (optionnel, calculé si non fourni)
   * @param configuration Configuration de la guild (optionnel)
   * @returns La guild existante ou nouvellement créée
   */
  public async getOrCreateGuild(
    uuidGuild: string, 
    name: string,
    memberCount?: string,
    configuration?: Record<string, any>
  ): Promise<GuildDto> {
    try {
      logDebug('Get or Create Guild', { uuidGuild, name });
      
      // Pour éviter l'erreur 500, tentons directement de créer la guild
      // Si elle existe déjà, l'API devrait nous le signaler avec une erreur appropriée
      try {
        // Si memberCount n'est pas fourni, on utilise une valeur par défaut
        const actualMemberCount = memberCount || '0';
        
        logDebug('Trying to create Guild', { uuidGuild, memberCount: actualMemberCount });
        return await this.createGuild(uuidGuild, name, actualMemberCount, configuration);
      } catch (createError: any) {
        // Si l'erreur est due à une guild existante (généralement code 409 - Conflict)
        if (createError.message && (createError.message.includes('409') || createError.message.includes('400'))) {
          logDebug('Guild already exists (create returned conflict)', { uuidGuild });
          
          // Essayer de récupérer la guild existante
          const existingGuild = await this.getGuildById(uuidGuild);
          if (existingGuild) {
            return existingGuild;
          }
        }
        
        // Si l'erreur est d'un autre type, la propager
        throw createError;
      }
    } catch (error) {
      logError('Get or Create Guild error', error);
      throw error;
    }
  }
} 