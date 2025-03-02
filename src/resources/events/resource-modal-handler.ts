import { ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { ResourceService } from '../services/resource-service';
import { createResourceModal } from '../components/resource-components';
import { TempStorageService } from '../../core/services/temp-storage.service';
import { TagService } from '../../tag/services/tag.service';
import { createTagButton, createTagSelectMenu } from '../../tag/components/tag-components';
import { createTagValidationButtons } from '../../tag/components/tag-components';
import { RESOURCE_IDS } from '../../shared/constants/ids.constants';
import { FORM_LIMITS } from '../../shared/constants/forms.constants';

/**
 * Ouvre le modal de création de ressource
 */
export async function openResourceCreateModal(interaction: ButtonInteraction): Promise<void> {
  try {
    logDebug('Resource Modal', `Ouverture du modal de création de ressource pour ${interaction.user.tag}`);
    
    // Créer le modal de ressource
    const modal = createResourceModal();
    
    // Afficher le modal
    await interaction.showModal(modal);
  } catch (error) {
    logError('Resource Modal', `Erreur lors de l'ouverture du modal: ${error}`);
    await interaction.reply({
      content: 'Une erreur est survenue lors de l\'ouverture du formulaire de création de ressource.',
      ephemeral: true
    });
  }
}

/**
 * Gère la soumission du modal de création de ressource
 */
export async function handleResourceModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  if (interaction.customId !== 'resource_api_modal') return;
  
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // Récupérer les données du formulaire
    const title = interaction.fields.getTextInputValue('title');
    const description = interaction.fields.getTextInputValue('description');
    const content = interaction.fields.getTextInputValue('content');
    
    // Validation supplémentaire des champs (en plus des limites dans le modal)
    const { RESOURCE_TITLE_MAX, RESOURCE_DESCRIPTION_MAX, RESOURCE_CONTENT_MAX } = FORM_LIMITS;
    
    if (title.length > RESOURCE_TITLE_MAX) {
      await interaction.editReply({
        content: `❌ Erreur: Le titre ne doit pas dépasser ${RESOURCE_TITLE_MAX} caractères. Votre titre contient ${title.length} caractères.`
      });
      return;
    }
    
    if (description.length > RESOURCE_DESCRIPTION_MAX) {
      await interaction.editReply({
        content: `❌ Erreur: La description ne doit pas dépasser ${RESOURCE_DESCRIPTION_MAX} caractères. Votre description contient ${description.length} caractères.`
      });
      return;
    }
    
    if (content.length > RESOURCE_CONTENT_MAX) {
      await interaction.editReply({
        content: `❌ Erreur: Le contenu ne doit pas dépasser ${RESOURCE_CONTENT_MAX} caractères. Votre contenu contient ${content.length} caractères.`
      });
      return;
    }
    
    // Stocker les données temporairement
    const tempStorage = TempStorageService.getInstance();
    const storageKey = `resource_creation_${interaction.user.id}`;
    
    // Récupérer les tags disponibles
    const tagService = TagService.getInstance();
    const availableTags = await tagService.getAllTags();
    
    // Créer le menu de sélection de tags
    const tagSelectMenu = createTagSelectMenu(availableTags);
    
    // Créer les boutons de validation (qui incluent maintenant le bouton de création de tag)
    const validationButtons = createTagValidationButtons();
    
    // Afficher le sélecteur de tags
    const reply = await interaction.editReply({
      content: '**Étape 1/3:** Formulaire complété ✅\n**Étape 2/3:** Sélectionnez au moins un tag pour votre ressource',
      components: [tagSelectMenu, validationButtons]
    });
    
    // Stocker les données du message et de l'interaction pour pouvoir y revenir plus tard
    await tempStorage.storeData(storageKey, { 
      title, 
      description, 
      content, 
      userId: interaction.user.id,
      timestamp: new Date().toISOString(),
      // Stocker les informations du message pour le retrouver plus tard
      messageId: reply.id,
      channelId: interaction.channelId,
      originalInteractionId: interaction.id
    });
    
  } catch (error) {
    logError('Resource Modal', `Erreur lors du traitement du modal: ${error}`);
    await interaction.reply({
      content: 'Une erreur est survenue lors du traitement de votre ressource.',
      ephemeral: true
    });
  }
} 