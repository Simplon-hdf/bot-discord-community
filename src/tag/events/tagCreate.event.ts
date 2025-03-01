import { Events, ModalSubmitInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { TagService } from '../services/tag.service';
import { TempStorageService } from '../../resources/services/temp-storage.service';
import { RESOURCE_COLORS } from '../../constants/resource.constants';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: any) {
    // Gérer les soumissions de modal pour la création de tag
    if (interaction.isModalSubmit() && interaction.customId === 'tag_creation_modal') {
      await handleTagCreationModal(interaction);
      return;
    }

    // Gestion des commandes slash tag (si nécessaire)
    if (interaction.isChatInputCommand() && interaction.commandName === 'tag') {
      // Logique pour les commandes slash tag
    }
  }
};

/**
 * Gère la soumission du modal de création de tag
 */
async function handleTagCreationModal(interaction: ModalSubmitInteraction) {
  try {
    const tagName = interaction.fields.getTextInputValue('tag_name');
    const tagDescription = interaction.fields.getTextInputValue('tag_description');
    
    logDebug('Tag Creation', { tagName, tagDescription });
    
    // Créer le tag dans la base de données
    const tagService = TagService.getInstance();
    const newTag = await tagService.createTag(tagName, tagDescription);
    
    if (!newTag) {
      await interaction.reply({
        content: '❌ Erreur lors de la création du tag. Veuillez réessayer.',
        ephemeral: true
      });
      return;
    }
    
    logDebug('New Tag Created', { name: newTag.name, uuid: newTag.uuid });
    
    // Récupérer les données temporaires de la ressource
    const tempStorage = TempStorageService.getInstance();
    const tempData = tempStorage.getResourceData(interaction.user.id);
    
    if (!tempData) {
      await interaction.reply({
        content: '✅ Tag créé avec succès ! Vous pouvez maintenant créer une ressource et l\'utiliser.',
        ephemeral: true
      });
      return;
    }
    
    // Ajouter le tag à la liste des tags sélectionnés
    const selectedTags = tempData.selectedTags || [];
    if (!selectedTags.includes(newTag.uuid)) {
      selectedTags.push(newTag.uuid);
    }
    
    // Mettre à jour les données temporaires
    tempStorage.setResourceData(interaction.user.id, {
      ...tempData,
      selectedTags
    });

    // Créer le menu de sélection de couleur
    const colorSelect = new StringSelectMenuBuilder()
      .setCustomId('resource_color_select')
      .setPlaceholder(tempData.color ? 
        `Couleur actuelle : ${RESOURCE_COLORS.find(c => c.value === tempData.color)?.label || 'Bleu (défaut)'}` :
        'Choisissez une couleur pour votre ressource'
      )
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(RESOURCE_COLORS);
    
    const colorRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(colorSelect);
    
    // Ajouter des boutons pour la publication et réinitialisation
    const validateButton = new ButtonBuilder()
      .setCustomId('post_resource')
      .setLabel('Publier la ressource')
      .setStyle(ButtonStyle.Success)
      .setEmoji('📝');
      
    const resetButton = new ButtonBuilder()
      .setCustomId('reset_resource')
      .setLabel('Recommencer')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔄');

    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(validateButton, resetButton);
    
    // Répondre à l'utilisateur
    await interaction.update({
      content: `✅ Tag "${newTag.name}" créé avec succès ! Vous pouvez maintenant choisir une couleur ou publier directement votre ressource.`,
      components: [colorRow, buttonRow]
    });
    
    logDebug('Tag Creation Complete', `Tag "${newTag.name}" created and added to selection`);
  } catch (error) {
    logError('Tag Creation Modal', error);
    
    await interaction.reply({
      content: '❌ Une erreur est survenue lors de la création du tag. Veuillez réessayer.',
      ephemeral: true
    }).catch(e => {
      // En cas d'erreur pendant la réponse
      logError('Tag Creation Response', e);
    });
  }
} 