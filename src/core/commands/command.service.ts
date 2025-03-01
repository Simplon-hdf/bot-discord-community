import { Client, REST, Routes } from 'discord.js';
import { Command } from './command.interface';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Service singleton pour gérer les commandes
 */
export class CommandService {
  private static instance: CommandService;
  private commands: Map<string, Command> = new Map();
  private globalCommands: Command[] = [];
  private guildCommands: Command[] = [];

  private constructor() {}

  /**
   * Obtenir l'instance unique du service
   */
  public static getInstance(): CommandService {
    if (!CommandService.instance) {
      CommandService.instance = new CommandService();
    }
    return CommandService.instance;
  }

  /**
   * Enregistrer une commande dans le service
   */
  public registerCommand(command: Command): void {
    if (!command.data || !command.data.name) {
      logError('Command Service', 'Tentative d\'enregistrement d\'une commande invalide');
      return;
    }

    const commandName = command.data.name;
    this.commands.set(commandName, command);
    
    if (command.isGlobal) {
      this.globalCommands.push(command);
      logDebug('Command Service', `Commande globale enregistrée: ${commandName}`);
    } else {
      this.guildCommands.push(command);
      logDebug('Command Service', `Commande de serveur enregistrée: ${commandName}`);
    }
  }

  /**
   * Exécuter une commande
   */
  public async executeCommand(commandName: string, interaction: any): Promise<boolean> {
    const command = this.commands.get(commandName);
    if (!command) {
      return false;
    }

    try {
      await command.execute(interaction);
      return true;
    } catch (error) {
      logError(`Exécution de la commande ${commandName}`, error);
      return false;
    }
  }

  /**
   * Enregistrer toutes les commandes auprès de l'API Discord
   */
  public async registerCommandsWithDiscord(client: Client): Promise<void> {
    try {
      if (!client.user) {
        logError('Command Service', 'Client non connecté');
        return;
      }

      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN || '');
      
      // Enregistrer les commandes globales
      if (this.globalCommands.length > 0) {
        try {
          logDebug('Command Service', `Enregistrement de ${this.globalCommands.length} commandes globales...`);
          
          const globalCommandsData = this.globalCommands.map(cmd => cmd.data);
          await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: globalCommandsData }
          );
          
          logDebug('Command Service', `Commandes globales enregistrées avec succès`);
        } catch (error) {
          logError('Command Service - Commandes globales', error);
        }
      }
      
      // Enregistrer les commandes par serveur
      if (this.guildCommands.length > 0) {
        const guildCommandsData = this.guildCommands.map(cmd => cmd.data);
        
        for (const guild of client.guilds.cache.values()) {
          try {
            logDebug('Command Service', `Enregistrement de ${this.guildCommands.length} commandes pour ${guild.name}...`);
            
            await rest.put(
              Routes.applicationGuildCommands(client.user.id, guild.id),
              { body: guildCommandsData }
            );
            
            logDebug('Command Service', `Commandes enregistrées avec succès pour ${guild.name}`);
          } catch (error) {
            logError(`Command Service - Serveur ${guild.name}`, error);
          }
        }
      }
    } catch (error) {
      logError('Command Service', error);
    }
  }

  /**
   * Récupérer toutes les commandes
   */
  public getAllCommands(): Map<string, Command> {
    return this.commands;
  }
} 