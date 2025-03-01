import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ChannelConfigService } from '../../admin/services/channel-config.service';

export const createResourceCommand = new SlashCommandBuilder()
  .setName('create-resource')
  .setDescription('Crée une nouvelle ressource')
  .addStringOption(option =>
    option
      .setName('title')
      .setDescription('Le titre de la ressource')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('description')
      .setDescription('La description de la ressource')
      .setRequired(true)
  )
  .toJSON();

export async function handleCreateResource(interaction: ChatInputCommandInteraction) {
  const title = interaction.options.getString('title', true);
  const description = interaction.options.getString('description', true);

  try {
    const channelConfig = ChannelConfigService.getInstance();
    
    // Vérifier si le canal est configuré
    if (!channelConfig.getResourceChannelId()) {
      await interaction.reply({
        content: 'Le canal des ressources n\'a pas encore été configuré. Un administrateur doit d\'abord utiliser /set-resource-channel.',
        ephemeral: true
      });
      return;
    }

    // Créer le thread pour la ressource
    const thread = await channelConfig.createResourceThread(
      interaction.client,
      title,
      description
    );

    await interaction.reply({
      content: `✅ Votre ressource a été créée avec succès ! Vous pouvez la consulter ici : ${thread.url}`,
      ephemeral: true
    });

  } catch (error) {
    console.error('Erreur lors de la création de la ressource:', error);
    await interaction.reply({
      content: 'Une erreur est survenue lors de la création de la ressource. Veuillez réessayer plus tard.',
      ephemeral: true
    });
  }
} 