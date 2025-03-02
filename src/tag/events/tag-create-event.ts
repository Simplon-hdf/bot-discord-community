import { Events, ModalSubmitInteraction } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { TagService } from '../services/tag.service';
import { TempStorageService } from '../../core/services/temp-storage.service';
import { createTagSelectMenu, createTagValidationButtons } from '../components/tag-components';
import { TAG_IDS } from '../../shared/constants/ids.constants';

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
    // Utiliser deferUpdate au lieu de deferReply pour ne pas créer un nouveau message
    await interaction.deferUpdate();
    
    const tagName = interaction.fields.getTextInputValue('tag_name');
    const tagDescription = interaction.fields.getTextInputValue('tag_description');
    
    // Créer le tag dans la base de données
    const tagService = TagService.getInstance();
    const newTag = await tagService.createTag(tagName, tagDescription);
    
    if (!newTag) {
      await interaction.followUp({ 
        content: '❌ Erreur lors de la création du tag. Veuillez réessayer.',
        ephemeral: true 
      });
      return;
    }
    
    // Récupérer les données temporaires de la ressource
    const tempStorage = TempStorageService.getInstance();
    const storageKey = `resource_creation_${interaction.user.id}`;
    const data = await tempStorage.getData(storageKey);
    
    // Si nous n'avons pas les données de création de ressource, informer l'utilisateur
    if (!data) {
      await interaction.followUp({ 
        content: `✅ Tag "${newTag.name}" créé avec succès !`,
        ephemeral: true
      });
      return;
    }
    
    // Ajouter le nouveau tag aux tags sélectionnés
    const selectedTags = data.selectedTags || [];
    if (!selectedTags.includes(newTag.uuid)) {
      selectedTags.push(newTag.uuid);
    }
    
    // Mettre à jour les données temporaires avec le nouveau tag
    await tempStorage.storeData(storageKey, { selectedTags }, true);
    
    // Récupérer tous les tags disponibles, incluant le nouveau tag
    const availableTags = await tagService.getAllTags();
    
    // Créer le menu de sélection avec le nouveau tag présélectionné
    const tagSelectMenu = createTagSelectMenu(availableTags, selectedTags);
    const validationButtons = createTagValidationButtons();
    
    // Mettre à jour directement l'interface avec le nouveau tag sélectionné
    await interaction.editReply({
      content: `**Étape 1/3:** Formulaire complété ✅\n**Étape 2/3:** Sélection de tags ✅ (Tag "${newTag.name}" ajouté à la sélection)\n\nSélectionnez d'autres tags si nécessaire, ou confirmez votre sélection.`,
      components: [tagSelectMenu, validationButtons]
    });
    
  } catch (error) {
    logError('Tag Creation Modal', error);
    try {
      // Utiliser followUp en cas d'erreur pour ne pas perturber l'interface
      await interaction.followUp({
        content: '❌ Une erreur est survenue lors de la création du tag. Veuillez réessayer.',
        ephemeral: true
      });
    } catch (e) {
      // En cas d'erreur pendant la réponse
      logError('Tag Creation Response', e);
    }
  }
}