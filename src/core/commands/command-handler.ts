import { ChatInputCommandInteraction } from 'discord.js';
import { CommandService } from './command.service';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Fonction centralisée pour gérer toutes les interactions de commandes
 */
export async function handleCommandInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
  const commandName = interaction.commandName;
  logDebug('Command Handler', `Commande exécutée: ${commandName}`);
  
  const commandService = CommandService.getInstance();
  const success = await commandService.executeCommand(commandName, interaction);
  
  if (!success) {
    logError('Command Handler', `Commande non trouvée ou erreur: ${commandName}`);
    
    try {
      // Vérifier si la réponse a déjà été envoyée
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'Une erreur est survenue lors de l\'exécution de la commande.',
          ephemeral: true
        });
      }
    } catch (error) {
      logError('Command Handler - Reply', error);
    }
  }
} 