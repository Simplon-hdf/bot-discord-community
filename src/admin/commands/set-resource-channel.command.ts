import { ChannelType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { ChannelConfigService } from '../services/channel-config.service';
import { logDebug, logError } from '../../utils/error.utils';
import { Command } from '../../core/commands/command.interface';

// Définition de la commande
const setResourceChannelCommand = new SlashCommandBuilder()
  .setName('set-resource-channel')
  .setDescription('Configure le canal où seront postées les ressources')
  .addChannelOption(option =>
    option
      .setName('channel')
      .setDescription('Le canal où seront postées les ressources')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .toJSON();

// Implémentation de la commande
async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('channel');
  
  if (!channel || channel.type !== ChannelType.GuildForum) {
    await interaction.reply({
      content: 'Veuillez sélectionner un canal de type forum.',
      ephemeral: true
    });
    return;
  }

  try {
    const channelConfig = ChannelConfigService.getInstance();
    channelConfig.setResourceChannel(channel.id);
    logDebug('Set Resource Channel', `Canal configuré: ${channel.name} (${channel.id})`);

    await interaction.reply({
      content: `Le canal ${channel} a été configuré avec succès pour les ressources.`,
      ephemeral: true
    });
  } catch (error) {
    logError('Set Resource Channel', error);
    await interaction.reply({
      content: 'Une erreur est survenue lors de la configuration du canal.',
      ephemeral: true
    });
  }
}

// Exporter la commande au format Command
export const setResourceChannelCommandConfig: Command = {
  data: setResourceChannelCommand,
  isGlobal: false, // Commande limitée aux serveurs (nécessite des permissions)
  execute
}; 