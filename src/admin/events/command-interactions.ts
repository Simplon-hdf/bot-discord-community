import { ChatInputCommandInteraction } from 'discord.js';
import { handleSetResourceChannel } from '../commands/set-resource-channel.command';
import { logDebug, logError } from '../../utils/error.utils';

export async function handleAdminCommand(interaction: ChatInputCommandInteraction) {
  try {
    switch (interaction.commandName) {
      case 'set-resource-channel':
        await handleSetResourceChannel(interaction);
        break;
      default:
        logDebug('Admin Command', `Commande inconnue: ${interaction.commandName}`);
        break;
    }
  } catch (error) {
    logError('Admin Command', error);
    await interaction.reply({
      content: 'Une erreur est survenue lors de l\'exécution de la commande.',
      ephemeral: true
    });
  }
} 