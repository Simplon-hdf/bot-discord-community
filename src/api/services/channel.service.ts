import { ApiService } from './api.service';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Interface représentant un canal à enregistrer dans l'API
 */
export interface ChannelCreateDto {
  uuid: string;               // ID Discord du canal
  name: string;               // Nom du canal
  type: string;               // Type de canal (text, voice, forum, etc.)
  channelPosition?: number;   // Position du canal (optionnel)
  uuidGuild: string;          // ID Discord du serveur
  uuidCategory?: string | null;      // ID Discord de la catégorie (optionnel ou null)
}

/**
 * Service pour l'interaction avec l'API des canaux
 */
export class ChannelApiService {
  private static instance: ChannelApiService;
  private apiService: ApiService;
  private readonly endpoint = 'channels';

  private constructor() {
    this.apiService = ApiService.getInstance();
  }

  /**
   * Récupère l'instance unique du service (Singleton)
   */
  public static getInstance(): ChannelApiService {
    if (!ChannelApiService.instance) {
      ChannelApiService.instance = new ChannelApiService();
    }
    return ChannelApiService.instance;
  }

  /**
   * Crée ou met à jour un canal dans la base de données
   * @param channelData Les données du canal à créer/mettre à jour
   */
  public async createOrUpdateChannel(channelData: ChannelCreateDto): Promise<any> {
    try {
      // Nettoyage des données avant envoi à l'API
      const cleanedData: Record<string, any> = {};
      
      // Copier seulement les champs non undefined
      for (const [key, value] of Object.entries(channelData)) {
        if (value !== undefined) {
          cleanedData[key] = value;
        }
      }
      
      // Vérifier si le canal existe déjà
      const existingChannel = await this.getChannelById(cleanedData.uuid);
      
      if (existingChannel) {
        // Mettre à jour le canal existant
        logDebug('Channel API Service', `Mise à jour du canal ${cleanedData.uuid} dans la base de données`);
        return await this.apiService.put(`${this.endpoint}/${cleanedData.uuid}`, cleanedData);
      } else {
        // Créer un nouveau canal
        logDebug('Channel API Service', `Création du canal ${cleanedData.uuid} dans la base de données`);
        return await this.apiService.post(this.endpoint, cleanedData);
      }
    } catch (error) {
      logError('Channel API Service', `Erreur lors de la création/mise à jour du canal: ${error}`);
      return null;
    }
  }

  /**
   * Récupère un canal par son ID Discord
   * @param channelId ID Discord du canal
   */
  public async getChannelById(channelId: string): Promise<any> {
    try {
      const response = await this.apiService.get(`${this.endpoint}/${channelId}`);
      return response?.data || null;
    } catch (error) {
      // On ne log pas d'erreur ici car c'est normal si le canal n'existe pas encore
      return null;
    }
  }

  /**
   * Récupère les canaux d'un serveur
   * @param guildId ID Discord du serveur
   */
  public async getChannelsByGuild(guildId: string): Promise<any[]> {
    try {
      // Utilisation du champ params pour passer les paramètres de requête
      const response = await this.apiService.get(this.endpoint, {
        params: { uuidGuild: guildId }
      });
      
      // S'assurer que nous retournons toujours un tableau
      return Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
      logError('Channel API Service', `Erreur lors de la récupération des canaux: ${error}`);
      return [];
    }
  }
} 