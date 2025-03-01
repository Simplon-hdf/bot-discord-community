import { Client } from 'discord.js';
import { CommandService } from './command.service';
import { logDebug, logError } from '../../utils/error.utils';

// Importer les configurations de commandes
import { clearDMCommandConfig } from '../../user/commands/clear-dm.command';
import { setResourceChannelCommandConfig } from '../../admin/commands/set-resource-channel.command';
import { infoBotCommandConfig } from '../../admin/commands/info-bot.command';

/**
 * Initialise le registre de commandes avec toutes les commandes disponibles
 */
export function initializeCommandRegistry(): void {
  try {
    const commandService = CommandService.getInstance();
    
    // Enregistrer les commandes utilisateur
    commandService.registerCommand(clearDMCommandConfig);
    
    // Enregistrer les commandes admin
    commandService.registerCommand(setResourceChannelCommandConfig);
    commandService.registerCommand(infoBotCommandConfig);
    
    // Ajouter ici les nouvelles commandes lors de leur création
    
    logDebug('Command Registry', 'Toutes les commandes ont été enregistrées avec succès');
  } catch (error) {
    logError('Command Registry', `Erreur lors de l'initialisation du registre de commandes: ${error}`);
  }
}

/**
 * Enregistre toutes les commandes auprès de l'API Discord
 */
export async function registerCommandsWithDiscord(client: Client): Promise<void> {
  try {
    const commandService = CommandService.getInstance();
    await commandService.registerCommandsWithDiscord(client);
    logDebug('Command Registry', 'Toutes les commandes ont été enregistrées auprès de Discord');
  } catch (error) {
    logError('Command Registry', `Erreur lors de l'enregistrement des commandes: ${error}`);
  }
} 