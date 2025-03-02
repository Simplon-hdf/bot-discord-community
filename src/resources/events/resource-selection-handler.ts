import { StringSelectMenuInteraction, ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { ResourceService } from '../services/resource-service';
import { createResourceConfirmEmbed, createColorSelectMenu, createResourcePreviewEmbed } from '../components/resource-components';
import { TempStorageService } from '../../core/services/temp-storage.service';
import { COLORS, RESOURCE_COLORS } from '../../shared/constants/ui.constants';
import { TagService } from '../../tag/services/tag.service';
import { createTagButton, createTagSelectMenu, createTagValidationButtons } from '../../tag/components/tag-components';
import { RESOURCE_IDS } from '../../shared/constants/ids.constants';

/**
 * Gère les interactions avec le menu de sélection de tag
 */
export async function handleTagSelectionMenu(interaction: StringSelectMenuInteraction): Promise<void> {
  if (interaction.customId !== 'resource_tag_select') return;
  
  try {
    await interaction.deferUpdate();
    
    // Récupérer les tags sélectionnés
    const selectedTagIds = interaction.values;
    
    // Vérifier si la sélection contient l'option "aucun tag disponible"
    if (selectedTagIds.includes('no_tags_available')) {
      await interaction.editReply({
        content: 'Veuillez créer au moins un tag pour votre ressource.',
        components: [createTagButton()]
      });
      return;
    }
    
    // Récupérer les données stockées
    const tempStorage = TempStorageService.getInstance();
    const storageKey = `resource_creation_${interaction.user.id}`;
    const data = await tempStorage.getData(storageKey);
    
    if (!data || !data.title || !data.description || !data.content) {
      throw new Error("Données de ressource manquantes");
    }
    
    // Stocker les tags sélectionnés et les informations du message si elles n'existent pas déjà
    const updateData: any = { selectedTags: selectedTagIds };
    
    // Si les informations du message ne sont pas encore stockées, les ajouter
    if (!data.messageId && interaction.message) {
      updateData.messageId = interaction.message.id;
      updateData.channelId = interaction.channelId;
    }
    
    await tempStorage.storeData(storageKey, updateData, true);
    
    // Récupérer le service de tag pour obtenir les noms de tags
    const tagService = TagService.getInstance();
    const tagNames = await tagService.getTagNamesByIds(selectedTagIds);
    
    // Mettre à jour l'interface avec les tags sélectionnés et les boutons de validation
    // Sans passer automatiquement à l'étape 3
    const tagSelectMenu = createTagSelectMenu(await tagService.getAllTags(), selectedTagIds);
    const validationButtons = createTagValidationButtons();
    
    await interaction.editReply({
      content: `**Étape 1/3:** Formulaire complété ✅\n**Étape 2/3:** Tags sélectionnés: ${tagNames.join(', ')}\n\nVous pouvez sélectionner d'autres tags, créer un nouveau tag, ou confirmer votre sélection pour passer à l'étape suivante.`,
      components: [tagSelectMenu, validationButtons]
    });
  } catch (error) {
    logError('Tag Selection', `Erreur lors du traitement des tags: ${error}`);
    await interaction.editReply({
      content: 'Une erreur est survenue lors de la sélection des tags.',
      components: []
    });
  }
}

/**
 * Gère les interactions avec le menu de sélection de couleur
 */
export async function handleColorSelectionMenu(interaction: StringSelectMenuInteraction): Promise<void> {
  if (interaction.customId !== 'resource_color_select') return;
  
  try {
    await interaction.deferUpdate();
    
    // Récupérer la couleur sélectionnée
    const selectedColor = interaction.values[0] || COLORS.DEFAULT;
    
    // Récupérer les données stockées
    const tempStorage = TempStorageService.getInstance();
    const storageKey = `resource_creation_${interaction.user.id}`;
    const data = await tempStorage.getData(storageKey);
    
    if (!data || !data.title || !data.description || !data.content) {
      throw new Error("Données de ressource manquantes");
    }
    
    // Stocker la couleur
    await tempStorage.storeData(storageKey, { color: selectedColor }, true);
    
    // Si les tags n'ont pas encore été sélectionnés, afficher le sélecteur de tags
    if (!data.selectedTags || data.selectedTags.length === 0) {
      const tagService = TagService.getInstance();
      const availableTags = await tagService.getAllTags();
      
      const tagSelectMenu = createTagSelectMenu(availableTags);
      const tagButton = createTagButton();
      
      await interaction.editReply({
        content: `**Étape 2/3:** Couleur sélectionnée\n**Étape 3/3:** Sélectionnez au moins un tag pour votre ressource`,
        components: [tagSelectMenu, tagButton]
      });
      return;
    }
    
    // Récupérer le GuildMember pour avoir accès au nickname
    const guildMember = interaction.member;
    
    // Créer un aperçu avec la nouvelle couleur
    const previewEmbed = createResourcePreviewEmbed(
      data.title,
      data.description,
      data.content,
      selectedColor,
      interaction.user,
      guildMember // Passer le GuildMember pour accéder au nickname
    );
    
    // Créer les boutons pour cette étape (mêmes boutons que pour la sélection de couleur)
    const colorSelectMenu = createColorSelectMenu();
    const colorButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_resource')
          .setLabel('Publier la ressource')
          .setStyle(ButtonStyle.Success)
          .setEmoji('📢'),
        new ButtonBuilder()
          .setCustomId('cancel_resource')
          .setLabel('Annuler')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );
    
    // Mettre à jour l'interface avec l'aperçu de la ressource
    await interaction.editReply({
      content: `**Étape 1/3:** Formulaire complété ✅\n**Étape 2/3:** Sélection de tags ✅\n**Étape 3/3:** Couleur ${getColorNameByValue(selectedColor)} sélectionnée\n\nVoici un aperçu de votre ressource:`,
      embeds: [previewEmbed],
      components: [colorSelectMenu, colorButtons]
    });
  } catch (error) {
    logError('Color Selection', `Erreur lors de la gestion de la sélection de couleur: ${error}`);
    await interaction.editReply({
      content: 'Une erreur est survenue lors de la création de votre ressource.',
      components: []
    });
  }
}

/**
 * Publie la ressource à partir des données stockées
 */
export async function publishResource(interaction: StringSelectMenuInteraction | ButtonInteraction): Promise<void> {
  try {
    // Récupérer les données stockées
    const tempStorage = TempStorageService.getInstance();
    const storageKey = `resource_creation_${interaction.user.id}`;
    const data = await tempStorage.getData(storageKey);
    
    if (!data || !data.title || !data.description || !data.content || !data.selectedTags || data.selectedTags.length === 0) {
      throw new Error("Données de ressource incomplètes");
    }
    
    // Récupérer le GuildMember pour avoir accès au nickname
    const guildMember = interaction.member;
    
    // Créer la ressource
    const resourceService = ResourceService.getInstance();
    const resourceUrl = await resourceService.createResource(
      interaction.client,
      data.title,
      data.description,
      data.content,
      interaction.user,
      data.selectedTags,
      data.color || COLORS.DEFAULT
    );
    
    if (!resourceUrl) {
      throw new Error("Échec de la création de la ressource");
    }
    
    // Afficher la confirmation
    const confirmEmbed = createResourceConfirmEmbed(
      data.title, 
      data.description, 
      data.color || COLORS.DEFAULT,
      interaction.user,
      guildMember // Passer le GuildMember pour accéder au nickname
    );
    
    // Ajouter un lien cliquable vers la ressource publiée
    await interaction.editReply({
      content: `✅ **Votre ressource a été publiée avec succès !**\n\n📌 **Accéder à votre ressource :** [Cliquez ici pour voir votre publication](${resourceUrl})`,
      embeds: [confirmEmbed],
      components: []
    });
    
    // Supprimer les données temporaires
    await tempStorage.deleteData(storageKey);
    
    logDebug('Resource Creation', `Ressource "${data.title}" publiée avec succès par ${interaction.user.tag}`);
  } catch (error) {
    logError('Publish Resource', `Erreur lors de la publication de la ressource: ${error}`);
    await interaction.editReply({
      content: 'Une erreur est survenue lors de la publication de votre ressource.',
      components: []
    });
  }
}

/**
 * Obtient le nom d'une couleur à partir de sa valeur hexadécimale
 */
function getColorNameByValue(colorValue: string): string {
  const colorObj = RESOURCE_COLORS.find(color => color.value === colorValue);
  return colorObj ? colorObj.label : 'personnalisée';
}