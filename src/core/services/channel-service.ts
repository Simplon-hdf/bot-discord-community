import { Channel, Client, TextChannel, ForumChannel, Guild, ChannelType as DiscordChannelType } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { ChannelApiService } from '../../api/services/channel.service';

/**
 * Types de canaux gérés par le bot
 */
export enum ChannelType {
  WELCOME = 'welcome',
  RESOURCES = 'resources'
}

// Mapping entre les types de canaux du bot et les types de canaux dans la base de données
export enum BotChannelType {
  WELCOME = "welcome",
  RESOURCES = "resources"
}

/**
 * Service de configuration et de gestion des canaux
 * Centralise l'accès aux canaux Discord utilisés par les différents modules
 */
export class ChannelService {
  private static instance: ChannelService;
  
  // Stockage des IDs de canaux par type et par serveur
  private channelIds: Map<string, Map<ChannelType, string>> = new Map();
  
  private constructor() {}

  /**
   * Récupère l'instance unique du service (Singleton)
   */
  public static getInstance(): ChannelService {
    if (!ChannelService.instance) {
      ChannelService.instance = new ChannelService();
    }
    return ChannelService.instance;
  }

  /**
   * Initialise les canaux depuis la base de données
   * @param guildId ID du serveur
   */
  public async initializeChannelsFromDatabase(guildId: string): Promise<void> {
    try {
      // Récupérer les canaux depuis la base de données
      const channelApiService = ChannelApiService.getInstance();
      const channels = await channelApiService.getChannelsByGuild(guildId);
      
      logDebug('Channel Service', `Chargement des canaux depuis la base de données pour le serveur ${guildId}`);
      
      // Si aucun canal n'est trouvé, on arrête l'initialisation
      if (!channels || channels.length === 0) {
        logDebug('Channel Service', `Aucun canal trouvé dans la base de données pour le serveur ${guildId}`);
        return;
      }
      
      // Pour chaque canal, vérifier son type et l'ajouter au service
      for (const channel of channels) {
        // Utiliser le type comme critère principal
        if (channel.type === 'OnboardingCommunity') {
          this.setChannel(guildId, ChannelType.WELCOME, channel.uuid);
          logDebug('Channel Service', `Canal de bienvenue chargé depuis la BDD: ${channel.uuid} (${channel.name})`);
        } else if (channel.type === 'ResourcesCommunity') {
          this.setChannel(guildId, ChannelType.RESOURCES, channel.uuid);
          logDebug('Channel Service', `Canal de ressources chargé depuis la BDD: ${channel.uuid} (${channel.name})`);
        } 
        // Fallback sur la détection par nom si le type ne correspond pas
        else if (channel.name?.includes('bienvenue') || channel.name?.includes('accueil')) {
          this.setChannel(guildId, ChannelType.WELCOME, channel.uuid);
          logDebug('Channel Service', `Canal de bienvenue détecté par son nom: ${channel.uuid} (${channel.name})`);
        } else if (channel.name?.includes('ressource')) {
          this.setChannel(guildId, ChannelType.RESOURCES, channel.uuid);
          logDebug('Channel Service', `Canal de ressources détecté par son nom: ${channel.uuid} (${channel.name})`);
        }
      }
      
      logDebug('Channel Service', `Initialisation des canaux terminée pour le serveur ${guildId}`);
    } catch (error) {
      logError('Channel Service', `Erreur lors de l'initialisation des canaux: ${error}`);
    }
  }

  /**
   * Définit un canal pour un type spécifique dans un serveur
   * @param guildId ID du serveur
   * @param type Type de canal
   * @param channelId ID du canal
   */
  public setChannel(guildId: string, type: ChannelType, channelId: string): void {
    if (!this.channelIds.has(guildId)) {
      this.channelIds.set(guildId, new Map());
    }
    
    this.channelIds.get(guildId)?.set(type, channelId);
    logDebug('Channel Service', `Canal ${type} configuré pour ${guildId}: ${channelId}`);
  }

  /**
   * Récupère l'ID d'un canal pour un type spécifique dans un serveur
   * @param guildId ID du serveur
   * @param type Type de canal
   * @returns ID du canal ou null si non configuré
   */
  public getChannelId(guildId: string, type: ChannelType): string | null {
    return this.channelIds.get(guildId)?.get(type) || null;
  }

  /**
   * Récupère un canal pour un type spécifique dans un serveur
   * @param client Client Discord
   * @param guildId ID du serveur
   * @param type Type de canal
   * @returns Objet Canal ou null si non trouvé
   */
  public getChannel(client: Client, guildId: string, type: ChannelType): Channel | null {
    const channelId = this.getChannelId(guildId, type);
    if (!channelId) return null;
    
    return client.channels.cache.get(channelId) || null;
  }

  /**
   * Récupère un canal de bienvenue
   * @param client Client Discord
   * @param guildId ID du serveur
   * @returns Canal de texte ou null
   */
  public getWelcomeChannel(client: Client, guildId: string): TextChannel | null {
    const channel = this.getChannel(client, guildId, ChannelType.WELCOME);
    return channel instanceof TextChannel ? channel : null;
  }

  /**
   * Récupère un canal de ressources
   * @param client Client Discord
   * @param guildId ID du serveur
   * @returns Canal de forum ou null
   */
  public getResourcesChannel(client: Client, guildId: string): ForumChannel | null {
    const channel = this.getChannel(client, guildId, ChannelType.RESOURCES);
    return channel instanceof ForumChannel ? channel : null;
  }
} 