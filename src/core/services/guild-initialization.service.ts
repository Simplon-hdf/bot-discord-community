import { Client, Guild } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Service responsable de l'initialisation des guilds dans la base de données
 */
export class GuildInitializationService {
  private static instance: GuildInitializationService;

  private constructor() {}

  public static getInstance(): GuildInitializationService {
    if (!GuildInitializationService.instance) {
      GuildInitializationService.instance = new GuildInitializationService();
    }
    return GuildInitializationService.instance;
  }

  /**
   * Initialise tous les serveurs où le bot est présent dans la base de données
   */
  public async initializeGuilds(client: Client): Promise<void> {
    logDebug('Guild Initialization', 'Initialisation des serveurs dans la base de données');
    
    for (const guild of client.guilds.cache.values()) {
      try {
        await this.initializeGuild(guild);
      } catch (error) {
        logError(`Initialisation du serveur ${guild.name}`, error);
      }
    }
  }

  /**
   * Initialise un serveur spécifique dans la base de données
   */
  public async initializeGuild(guild: Guild): Promise<void> {
    try {
      const { GuildApiService } = await import('../../api/services/guild.service');
      const guildApiService = GuildApiService.getInstance();
      
      logDebug('Guild Initialization', `Initialisation du serveur ${guild.name} (${guild.id}) dans la base de données`);
      await guildApiService.getOrCreateGuild(
        guild.id,
        guild.name,
        guild.memberCount.toString(),
        {} // Configuration vide par défaut
      );
      logDebug('Guild Initialization', `Serveur ${guild.name} initialisé dans la base de données`);
    } catch (error) {
      logError(`Initialisation du serveur ${guild.name}`, error);
      throw error;
    }
  }
} 