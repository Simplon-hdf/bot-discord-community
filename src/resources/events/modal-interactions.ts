import { ModalSubmitInteraction, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ResourceService } from '../services/resource.service';
import { TempStorageService } from '../services/temp-storage.service';
import { RESOURCE_COLORS, DEFAULT_COLOR } from '../../constants/resource.constants';
import { logDebug, logError } from '../../utils/error.utils';
import { handleResourceApiModalSubmit } from './api-modal-interactions';

export async function handleResourceModalSubmit(interaction: ModalSubmitInteraction) {
  // Rediriger le modal de création de tag vers le gestionnaire dans le module tag
  if (interaction.customId === 'tag_creation_modal') {
    // Cette logique est maintenant gérée dans src/tag/events/tagCreate.event.ts
    // Le gestionnaire global d'événements va le diriger vers le bon gestionnaire
    return;
  }
  
  // Traiter le modal API pour la création de ressource
  if (interaction.customId === 'resource_api_modal') {
    await handleResourceApiModalSubmit(interaction);
    return;
  }
  
  // Traiter le modal de création de ressource standard
  if (interaction.customId !== 'resource_creation_modal') {
    return;
  }
  
  const title = interaction.fields.getTextInputValue('title');
  const description = interaction.fields.getTextInputValue('description');
  
  logDebug('Resource Modal', {
    title,
    description: description.substring(0, 50) + '...'
  });
  
  // Sauvegarder les données temporairement
  const tempStorage = TempStorageService.getInstance();
  
  tempStorage.setResourceData(interaction.user.id, {
    userId: interaction.user.id,
    title,
    description,
    timestamp: Date.now(),
    color: DEFAULT_COLOR
  });
  
  // Créer le menu de sélection de couleur
  const colorSelect = new StringSelectMenuBuilder()
    .setCustomId('resource_color_select')
    .setPlaceholder('Choisissez une couleur pour votre ressource')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(RESOURCE_COLORS);
  
  const colorRow = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(colorSelect);
  
  // Ajouter des boutons pour:
  // 1. Publier directement avec la couleur par défaut
  // 2. Réinitialiser
  
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
  
  await interaction.reply({
    content: 'Veuillez configurer votre ressource. Vous pouvez choisir une couleur ou publier directement.',
    components: [colorRow, buttonRow],
    ephemeral: true
  });
} 