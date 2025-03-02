import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { openResourceCreateModal } from './resource-modal-handler';
import { TempStorageService } from '../../core/services/temp-storage.service';
import { publishResource } from './resource-selection-handler';
import { handleTagButtonInteraction } from '../../tag/events/tag-button-handler';
import { TagService } from '../../tag/services/tag.service';
import { createTagSelectMenu, createTagValidationButtons } from '../../tag/components/tag-components';
import { createColorSelectMenu } from '../components/resource-components';
import { RESOURCE_IDS, TAG_IDS } from '../../shared/constants/ids.constants';

/**
 * Gère le bouton de publication directe de ressource après sélection de couleur
 */
export async function handleConfirmResourceButton(interaction: ButtonInteraction): Promise<boolean> {
  if (interaction.customId !== 'confirm_resource') {
    return false;
  }
  
  try {
    // Utiliser la même fonction que pour la confirmation des tags
    await interaction.deferUpdate();
    await publishResource(interaction);
    return true;
  } catch (error) {
    logError('Confirm Resource', `Erreur lors de la publication de la ressource: ${error}`);
    return false;
  }
}

/**
 * Gère les interactions avec le bouton de création de ressource
 */
export async function handleCreateResourceButton(interaction: ButtonInteraction): Promise<boolean> {
  if (interaction.customId !== 'create_resource' && interaction.customId !== 'create_resource_dashboard') {
    return false;
  }

  logDebug('Create Resource', `Bouton de création de ressource cliqué par ${interaction.user.tag}`);
  
  try {
    // Ouvrir le modal de création de ressource
    await openResourceCreateModal(interaction);
    return true;
  } catch (error) {
    logError('Create Resource', `Erreur lors du traitement du bouton: ${error}`);
    return false;
  }
}

/**
 * Gère le bouton de confirmation des tags
 */
export async function handleConfirmTagsButton(interaction: ButtonInteraction): Promise<boolean> {
  if (interaction.customId !== 'confirm_tags') {
    return false;
  }
  
  try {
    await interaction.deferUpdate();
    
    // Récupérer les données temporaires
    const tempStorage = TempStorageService.getInstance();
    const storageKey = `resource_creation_${interaction.user.id}`;
    const data = await tempStorage.getData(storageKey);
    
    if (!data || !data.selectedTags || data.selectedTags.length === 0) {
      await interaction.followUp({
        content: '❌ Vous devez sélectionner au moins un tag avant de continuer.',
        ephemeral: true
      });
      return true;
    }
    
    // Créer le menu de sélection de couleur
    const colorSelectMenu = createColorSelectMenu();
    
    // Créer les boutons pour cette étape
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
    
    // Mettre à jour l'interface
    await interaction.editReply({
      content: '**Étape 1/3:** Formulaire complété ✅\n**Étape 2/3:** Sélection de tags ✅\n**Étape 3/3:** Vous pouvez choisir une couleur pour votre ressource (optionnel, modifiable)',
      components: [colorSelectMenu, colorButtons]
    });
    
    return true;
  } catch (error) {
    logError('Confirm Tags', `Erreur lors du passage à l'étape de sélection de couleur: ${error}`);
    return false;
  }
}

/**
 * Gère le bouton d'annulation de création de ressource
 */
export async function handleCancelResourceButton(interaction: ButtonInteraction): Promise<boolean> {
  if (interaction.customId !== 'cancel_resource') {
    return false;
  }
  
  try {
    // Supprimer les données temporaires
    const tempStorage = TempStorageService.getInstance();
    const storageKey = `resource_creation_${interaction.user.id}`;
    await tempStorage.deleteData(storageKey);
    
    // Informer l'utilisateur
    await interaction.update({
      content: '❌ Création de ressource annulée.',
      components: []
    });
    
    return true;
  } catch (error) {
    logError('Cancel Resource', `Erreur lors de l'annulation: ${error}`);
    return false;
  }
}

/**
 * Gère le bouton qui permet de passer à l'étape de sélection de couleur
 */
export async function handleContinueToColorButton(interaction: ButtonInteraction): Promise<boolean> {
  if (interaction.customId !== 'continue_to_color') {
    return false;
  }
  
  try {
    await interaction.deferUpdate();
    
    // Récupérer les données temporaires
    const tempStorage = TempStorageService.getInstance();
    const storageKey = `resource_creation_${interaction.user.id}`;
    const data = await tempStorage.getData(storageKey);
    
    if (!data || !data.selectedTags || data.selectedTags.length === 0) {
      await interaction.followUp({
        content: '❌ Vous devez sélectionner au moins un tag avant de continuer.',
        ephemeral: true
      });
      return true;
    }
    
    // Créer le menu de sélection de couleur
    const colorSelectMenu = createColorSelectMenu();
    
    // Créer les boutons pour cette étape
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
    
    // Mettre à jour l'interface
    await interaction.editReply({
      content: '**Étape 1/3:** Formulaire complété ✅\n**Étape 2/3:** Sélection de tags ✅\n**Étape 3/3:** Vous pouvez choisir une couleur pour votre ressource (optionnel, modifiable)',
      components: [colorSelectMenu, colorButtons]
    });
    
    return true;
  } catch (error) {
    logError('Continue To Color', `Erreur lors du passage à l'étape de sélection de couleur: ${error}`);
    return false;
  }
}

/**
 * Fonction centrale qui gère toutes les interactions de bouton liées aux ressources
 */
export async function handleResourceButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  try {
    // Essayer chaque gestionnaire spécifique
    if (await handleCreateResourceButton(interaction)) return;
    if (await handleTagButtonInteraction(interaction)) return;
    if (await handleConfirmTagsButton(interaction)) return;
    if (await handleConfirmResourceButton(interaction)) return;
    if (await handleCancelResourceButton(interaction)) return;
    if (await handleContinueToColorButton(interaction)) return;
    
    // Si aucun gestionnaire n'a pris en charge cette interaction
    logDebug('Resource Button', `Bouton non géré: ${interaction.customId}`);
  } catch (error) {
    logError('Resource Button', `Erreur lors du traitement du bouton ${interaction.customId}: ${error}`);
    try {
      await interaction.reply({
        content: 'Une erreur est survenue lors du traitement de cette action.',
        ephemeral: true
      });
    } catch (replyError) {
      // Probablement déjà répondu
    }
  }
} 