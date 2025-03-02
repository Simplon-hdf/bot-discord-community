import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { TAG_IDS } from '../../shared/constants/ids.constants';
import { FORM_LIMITS } from '../../shared/constants/forms.constants';

/**
 * Ouvre le modal de création de tag
 */
export async function handleCreateTagButton(interaction: ButtonInteraction): Promise<boolean> {
  if (interaction.customId !== TAG_IDS.BTN_CREATE) {
    return false;
  }

  try {
    // Créer les composants du modal
    const tagNameInput = new TextInputBuilder()
      .setCustomId('tag_name')
      .setLabel('Nom du tag')
      .setPlaceholder('Entrez un nom court et descriptif')
      .setRequired(true)
      .setStyle(TextInputStyle.Short)
      .setMaxLength(FORM_LIMITS.TAG_NAME_MAX)
      .setMinLength(FORM_LIMITS.TAG_NAME_MIN);

    const tagDescriptionInput = new TextInputBuilder()
      .setCustomId('tag_description')
      .setLabel('Description du tag')
      .setPlaceholder('Décrivez ce que représente ce tag')
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(FORM_LIMITS.TAG_DESCRIPTION_MAX)
      .setMinLength(10);

    // Créer les rangées d'action pour le modal
    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(tagNameInput);
    const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(tagDescriptionInput);

    // Créer le modal
    const modal = new ModalBuilder()
      .setCustomId(TAG_IDS.MODAL_CREATE)
      .setTitle('Créer un nouveau tag')
      .addComponents(firstRow, secondRow);

    // Afficher le modal
    await interaction.showModal(modal);
    
    return true;
  } catch (error) {
    logError('Create Tag Button', `Erreur lors de l'ouverture du modal de création de tag: ${error}`);
    return false;
  }
}

/**
 * Gère toutes les interactions de bouton liées aux tags
 */
export async function handleTagButtonInteraction(interaction: ButtonInteraction): Promise<boolean> {
  try {
    // Essayer chaque gestionnaire spécifique aux tags
    if (await handleCreateTagButton(interaction)) return true;
    
    // Ajouter d'autres gestionnaires de boutons liés aux tags si nécessaire
    
    // Si aucun bouton n'est géré
    return false;
  } catch (error) {
    logError('Tag Button', `Erreur lors du traitement du bouton tag ${interaction.customId}: ${error}`);
    return false;
  }
} 