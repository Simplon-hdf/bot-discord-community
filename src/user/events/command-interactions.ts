import { ChatInputCommandInteraction } from 'discord.js';
import { handleClearDM } from '../commands/clear-dm.command';
import { logDebug, logError } from '../../utils/error.utils';

export async function handleUserCommand(interaction: ChatInputCommandInteraction) {
  try {
    switch (interaction.commandName) {
      case 'clear-dm':
        await handleClearDM(interaction);
        break;
      default:
        logDebug('User Command', `Commande inconnue: ${interaction.commandName}`);
        break;
    }
  } catch (error) {
    logError('User Command', error);
    await interaction.reply({
      content: 'Une erreur est survenue lors de l\'exécution de la commande.',
      ephemeral: true
    });
  }
} 