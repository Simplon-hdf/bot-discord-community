import { SlashCommandBuilder, ChannelType, CommandInteraction } from 'discord.js';
import { Command } from './command.interface';
import { logDebug, logError } from '../../utils/error.utils';
import { ChannelService, ChannelType as BotChannelType } from '../services/channel-service';
import { WelcomeService } from '../../onboarding/services/welcome-service';
import { ChannelApiService } from '../../api/services/channel.service';
import { ApiService } from '../../api/services/api.service';

// Créer la commande slash avec les options appropriées
const setChannelCommand = new SlashCommandBuilder()
  .setName('set-channel')
  .setDescription('Configure un canal pour une fonctionnalité spécifique du bot')
  .setDefaultMemberPermissions(0x0000000000000008) // ADMINISTRATOR
  .addStringOption(option => 
    option.setName('type')
      .setDescription('Type de canal à configurer')
      .setRequired(true)
      .addChoices(
        { name: 'Canal de bienvenue', value: 'welcome' },
        { name: 'Canal des ressources', value: 'resources' }
      )
  )
  .addChannelOption(option => 
    option.setName('channel')
      .setDescription('Canal à configurer')
      .setRequired(true)
  );

// Fonction pour créer une catégorie dans la base de données
async function createCategoryIfNeeded(categoryId: string, categoryName: string, guildId: string, position: number): Promise<void> {
  try {
    // Utiliser l'API service pour vérifier si la catégorie existe déjà
    const apiService = ApiService.getInstance();
    const response = await apiService.get(`categories/${categoryId}`);
    
    // Vérifier si la catégorie existe déjà en vérifiant la réponse
    if (!response.data) {
      // La catégorie n'existe pas, la créer
      logDebug('Set Channel Command', `Création de la catégorie ${categoryId} (${categoryName}) dans la base de données`);
      
      await apiService.post('categories', {
        uuid: categoryId,
        name: categoryName,
        position: position,
        uuidGuild: guildId
      });
      
      logDebug('Set Channel Command', `Catégorie ${categoryId} créée avec succès dans la base de données`);
    } else {
      logDebug('Set Channel Command', `La catégorie ${categoryId} existe déjà dans la base de données`);
    }
  } catch (error) {
    logError('Set Channel Command', `Erreur lors de la création de la catégorie ${categoryId}: ${error}`);
    // Ne pas interrompre le flux principal en cas d'erreur
  }
}

/**
 * Gère la commande set-channel
 */
async function handleSetChannelCommand(interaction: CommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ 
      content: 'Cette commande ne peut être utilisée que dans un serveur.', 
      ephemeral: true 
    });
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });
    
    const channelType = interaction.options.get('type')?.value as string;
    const channel = interaction.options.get('channel')?.channel;
    
    if (!channel) {
      await interaction.editReply('Le canal sélectionné est invalide.');
      return;
    }
    
    const channelService = ChannelService.getInstance();
    const botChannelType = channelType as BotChannelType;
    
    // Vérifier le type de canal approprié pour chaque fonctionnalité
    if (botChannelType === BotChannelType.WELCOME && channel.type !== ChannelType.GuildText) {
      await interaction.editReply('Le canal de bienvenue doit être un canal de texte.');
      return;
    } else if (botChannelType === BotChannelType.RESOURCES && channel.type !== ChannelType.GuildForum) {
      await interaction.editReply('Le canal des ressources doit être un forum.');
      return;
    }
    
    // Configurer le canal
    channelService.setChannel(interaction.guild.id, botChannelType, channel.id);
    
    // Enregistrer le canal dans la base de données
    try {
      const channelApiService = ChannelApiService.getInstance();
      
      // Récupérer des informations supplémentaires sur le canal si possible
      const fullChannel = interaction.client.channels.cache.get(channel.id);
      const guildChannel = fullChannel && 'guild' in fullChannel ? fullChannel : null;
      
      // Convertir le type de canal Discord en type fonctionnel pour notre bot
      // Au lieu d'utiliser les types standard (text, voice, etc.), on utilise nos propres types
      let apiChannelType = botChannelType === BotChannelType.WELCOME ? 
                          'OnboardingCommunity' : 'ResourcesCommunity';
      
      // Vérifier que le canal existe et appartient à une guilde
      if (interaction.guild && interaction.guild.id) {
        // Log des informations sur la catégorie parente pour le débogage
        if (guildChannel && 'parent' in guildChannel && guildChannel.parent) {
          logDebug('Set Channel Command', `Canal ${channel.id} a comme parent: ${guildChannel.parent.id} (${guildChannel.parent.name})`);
          
          // Créer la catégorie dans la base de données si elle existe dans Discord
          if (guildChannel.parent.id && guildChannel.parent.id.length >= 17) {
            await createCategoryIfNeeded(
              guildChannel.parent.id,
              guildChannel.parent.name,
              interaction.guild.id,
              guildChannel.parent.position
            );
          }
        } else {
          logDebug('Set Channel Command', `Canal ${channel.id} n'a pas de catégorie parente`);
        }
        
        // Préparer les données de base du canal pour l'API
        const channelData: {
          uuid: string;
          name: string;
          type: string;
          channelPosition: number;
          uuidGuild: string;
          uuidCategory?: string; // Optionnel
        } = {
          uuid: channel.id,
          name: channel.name || `canal-${channel.id}`,
          type: apiChannelType, // Utiliser notre type fonctionnel
          channelPosition: guildChannel && 'position' in guildChannel ? guildChannel.position : 0,
          uuidGuild: interaction.guild.id,
        };
        
        // Ajouter la catégorie seulement si elle existe
        if (guildChannel && 
            'parent' in guildChannel && 
            guildChannel.parent?.id && 
            guildChannel.parent.id.length >= 17) {
          channelData.uuidCategory = guildChannel.parent.id;
          logDebug('Set Channel Command', `Catégorie ${guildChannel.parent.id} ajoutée à la requête API`);
        } else {
          logDebug('Set Channel Command', `Aucune catégorie dans la requête API`);
        }
        
        await channelApiService.createOrUpdateChannel(channelData);
        logDebug('Set Channel Command', `Canal ${channel.id} enregistré dans la base de données`);
      }
    } catch (error) {
      logError('Set Channel Command', `Erreur lors de l'enregistrement du canal dans la base de données: ${error}`);
      // Ne pas interrompre le flux principal en cas d'erreur d'API
    }
    
    // Réponse de confirmation
    let successMessage = '';
    switch (botChannelType) {
      case BotChannelType.WELCOME:
        successMessage = `✅ Le canal de bienvenue a été configuré sur <#${channel.id}>.
        
Ce canal sera utilisé pour afficher les messages de bienvenue et d'introduction à la communauté.`;

        // Envoyer le message d'onboarding immédiatement
        try {
          const welcomeService = WelcomeService.getInstance();
          welcomeService.setWelcomeChannel(channel.id);
          await welcomeService.sendWelcomeMessage(interaction.client);
          successMessage += `\n\n✅ Le message d'onboarding a été envoyé avec succès.`;
          logDebug('Set Channel Command', `Message d'onboarding envoyé dans le canal ${channel.id}`);
        } catch (error) {
          logError('Set Channel Command', `Erreur lors de l'envoi du message d'onboarding: ${error}`);
          successMessage += `\n\n⚠️ Impossible d'envoyer le message d'onboarding: ${error}`;
        }
        break;
      case BotChannelType.RESOURCES:
        successMessage = `✅ Le canal des ressources a été configuré sur <#${channel.id}>.
        
Ce canal sera utilisé pour que les membres puissent partager des ressources avec la communauté.`;
        break;
      default:
        successMessage = `✅ Le canal a été configuré avec succès.`;
    }
    
    await interaction.editReply(successMessage);
    logDebug('Set Channel Command', `Canal ${botChannelType} configuré sur ${channel.id} par ${interaction.user.tag}`);
    
  } catch (error) {
    logError('Set Channel Command', error);
    await interaction.editReply('Une erreur est survenue lors de la configuration du canal.');
  }
}

// Exporter la configuration de la commande
export const setChannelCommandConfig: Command = {
  data: setChannelCommand,
  isGlobal: false, // Cette commande est spécifique aux serveurs
  execute: handleSetChannelCommand
}; 