import { ApiService } from './api.service';
import { DiscordUserCreateDto, DiscordUserDto } from '../types/discord-user.types';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Service pour interagir avec l'API des utilisateurs Discord
 */
export class DiscordUserApiService {
  private static instance: DiscordUserApiService;
  private apiService: ApiService;
  private readonly endpoint = 'discord-users';

  private constructor() {
    this.apiService = ApiService.getInstance();
  }

  /**
   * Obtient l'instance unique du service (Singleton)
   */
  public static getInstance(): DiscordUserApiService {
    if (!DiscordUserApiService.instance) {
      DiscordUserApiService.instance = new DiscordUserApiService();
    }
    return DiscordUserApiService.instance;
  }

  /**
   * Récupère un utilisateur Discord par son ID Discord
   */
  public async getDiscordUserById(uuidDiscord: string): Promise<DiscordUserDto | null> {
    try {
      const response = await this.apiService.get<DiscordUserDto>(`${this.endpoint}/${uuidDiscord}`);
      return response.data;
    } catch (error) {
      // Si l'erreur est 404, l'utilisateur n'existe pas
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      logError('Get Discord User By Id', error);
      return null;
    }
  }

  /**
   * Crée un nouvel utilisateur Discord
   */
  public async createDiscordUser(data: DiscordUserCreateDto): Promise<DiscordUserDto> {
    try {
      // S'assurer que le discriminator est correctement formaté
      // Discord utilise '0' ou chaîne vide pour les utilisateurs du nouveau système
      if (data.discriminator === '0' || !data.discriminator || data.discriminator === '') {
        logDebug('Normalizing Discriminator', { 
          original: data.discriminator, 
          normalized: '0000'
        });
        data.discriminator = '0000';
      }
      
      logDebug('Create Discord User', { data });
      const response = await this.apiService.post<DiscordUserDto>(this.endpoint, data);
      return response.data;
    } catch (error) {
      logError('Create Discord User', error);
      throw error;
    }
  }

  /**
   * Récupère ou crée un utilisateur Discord
   */
  public async getOrCreateDiscordUser(data: DiscordUserCreateDto): Promise<DiscordUserDto> {
    try {
      // S'assurer que le discriminator est correctement formaté
      // Discord utilise '0' pour les utilisateurs du nouveau système
      // Notre API attend '0000' comme valeur par défaut dans ce cas
      if (data.discriminator === '0' || !data.discriminator) {
        logDebug('Normalizing Discriminator', { 
          original: data.discriminator, 
          normalized: '0000'
        });
        data.discriminator = '0000';
      }

      // Essayer de récupérer l'utilisateur
      const existingUser = await this.getDiscordUserById(data.uuidDiscord);
      
      if (existingUser) {
        logDebug('Discord User Exists', { uuidDiscord: existingUser.uuidDiscord });
        return existingUser;
      }
      
      // Si on n'a pas trouvé d'utilisateur, en créer un nouveau
      logDebug('Creating New Discord User', { uuidDiscord: data.uuidDiscord });
      return await this.createDiscordUser(data);
    } catch (error) {
      logError('Get Or Create Discord User', error);
      throw error;
    }
  }
} 