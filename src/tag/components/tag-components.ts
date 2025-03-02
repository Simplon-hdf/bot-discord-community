import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { FORM_LIMITS } from '../../shared/constants/forms.constants';
import { TAG_IDS, RESOURCE_IDS } from '../../shared/constants/ids.constants';
import { TagDto } from '../../api/types/tag.types';

/**
 * Crée un menu de sélection pour les tags disponibles
 */
export function createTagSelectMenu(
  availableTags: TagDto[],
  selectedTags: string[] = []
): ActionRowBuilder<StringSelectMenuBuilder> {
  // Créer les options de tag
  const tagOptions = availableTags.map(tag => 
    new StringSelectMenuOptionBuilder()
      .setLabel(tag.name)
      .setDescription(tag.description || `Tag: ${tag.name}`)
      .setValue(tag.uuid)
      .setDefault(selectedTags.includes(tag.uuid)) // Présélectionner les tags déjà choisis
  );

  // Si aucun tag n'est disponible, ajouter une option factice
  if (tagOptions.length === 0) {
    tagOptions.push(
      new StringSelectMenuOptionBuilder()
        .setLabel('Aucun tag disponible')
        .setDescription('Créez un nouveau tag avec le bouton ci-dessous')
        .setValue('no_tags_available')
    );
  }

  // Créer le menu de sélection
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(RESOURCE_IDS.SELECT_TAG)
    .setPlaceholder(selectedTags.length > 0 
      ? `${selectedTags.length} tag(s) sélectionné(s)` 
      : 'Sélectionnez au moins un tag')
    .setMinValues(FORM_LIMITS.MIN_TAGS)
    .setMaxValues(Math.min(FORM_LIMITS.MAX_TAGS, tagOptions.length))
    .addOptions(tagOptions);

  // Désactiver le menu si aucun tag n'est disponible
  if (tagOptions.length === 0 || (tagOptions.length === 1 && tagOptions[0].data.value === 'no_tags_available')) {
    selectMenu.setDisabled(true);
  }

  return new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(selectMenu);
}

/**
 * Crée un bouton pour créer un nouveau tag
 */
export function createTagButton(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(TAG_IDS.BTN_CREATE)
        .setLabel('Créer un nouveau tag')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🏷️')
    );
}

/**
 * Crée un modal pour la création d'un nouveau tag
 */
export function createTagCreationModal(): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(TAG_IDS.MODAL_CREATE)
    .setTitle('Créer un nouveau tag');

  // Champ pour le nom du tag
  const nameInput = new TextInputBuilder()
    .setCustomId('tag_name')
    .setLabel('Nom du tag')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: JavaScript, Docker, React...')
    .setRequired(true)
    .setMinLength(FORM_LIMITS.TAG_NAME_MIN)
    .setMaxLength(FORM_LIMITS.TAG_NAME_MAX);

  // Champ pour la description du tag
  const descriptionInput = new TextInputBuilder()
    .setCustomId('tag_description')
    .setLabel('Description (optionnelle)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Une courte description de ce tag...')
    .setRequired(false)
    .setMaxLength(FORM_LIMITS.TAG_DESCRIPTION_MAX);

  // Ajouter les champs au modal
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput)
  );

  return modal;
}

/**
 * Crée des boutons pour la validation et l'annulation de la sélection de tags
 */
export function createTagValidationButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(TAG_IDS.BTN_CONFIRM)
        .setLabel('Confirmer les tags')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(TAG_IDS.BTN_CREATE)
        .setLabel('Créer un tag')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🏷️'),
      new ButtonBuilder()
        .setCustomId(RESOURCE_IDS.BTN_CANCEL)
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );
} 