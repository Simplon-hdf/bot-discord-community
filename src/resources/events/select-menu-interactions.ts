import { StringSelectMenuInteraction, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ResourceService } from '../services/resource.service';
import { TempStorageService } from '../services/temp-storage.service';
import { logDebug } from '../../utils/error.utils';

const RESOURCE_COLORS = [
  { label: '🔵 Bleu', value: '0x0099ff', description: 'Couleur par défaut' },
  { label: '🔴 Rouge', value: '0xff0000', description: 'Pour les ressources importantes' },
  { label: '🟢 Vert', value: '0x00ff00', description: 'Pour les ressources validées' },
  { label: '🟡 Jaune', value: '0xffff00', description: 'Pour les astuces et conseils' },
  { label: '🟣 Violet', value: '0x9b59b6', description: 'Pour les tutoriels' },
  { label: '🟠 Orange', value: '0xe67e22', description: 'Pour les bonnes pratiques' },
  { label: '⚫ Noir', value: '0x34495e', description: 'Pour les ressources techniques' },
  { label: '🔘 Gris', value: '0x95a5a6', description: 'Pour les ressources générales' }
];

export async function handleResourceSelectMenuInteraction(interaction: StringSelectMenuInteraction) {
  const tempStorage = TempStorageService.getInstance();
  const tempData = tempStorage.getResourceData(interaction.user.id);

  if (!tempData) {
    console.error('[ERROR] Données temporaires non trouvées');
    await interaction.reply({
      content: '❌ Une erreur est survenue : données non trouvées. Veuillez recommencer la création de la ressource.',
      ephemeral: true
    });
    return;
  }

  if (interaction.user.id !== tempData.userId) {
    console.warn(`[WARN] Tentative d'accès non autorisé: ${interaction.user.id} != ${tempData.userId}`);
    await interaction.reply({
      content: '❌ Vous ne pouvez pas modifier cette ressource.',
      ephemeral: true
    });
    return;
  }

  if (interaction.customId === 'resource_color_select') {
    const color = interaction.values[0];
    tempStorage.setResourceData(interaction.user.id, {
      ...tempData,
      color
    });

    const selectedColor = RESOURCE_COLORS.find(c => c.value === color);
    
    // Ajouter un bouton pour valider directement sans étape de tag
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
    
    // Ne pas utiliser createMenus() ni chercher à afficher le menu de tags
    const colorRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('resource_color_select')
          .setPlaceholder(`Couleur actuelle : ${selectedColor?.label || 'Bleu (défaut)'}`)
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(RESOURCE_COLORS)
      );

    await interaction.update({
      content: `✨ Couleur sélectionnée : ${selectedColor?.label || 'Bleu (défaut)'}\nVous pouvez maintenant publier votre ressource ou choisir une autre couleur.`,
      components: [colorRow, buttonRow]
    });
  }
} 