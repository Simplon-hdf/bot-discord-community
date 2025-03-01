import { ModalSubmitInteraction, ButtonInteraction, ModalBuilder, 
         TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ResourceApiService } from '../../api/services/resource.service';
import { MemberService } from '../../members/services/member.service';
import { TempStorageService } from '../services/temp-storage.service';
import { logDebug, logError } from '../../utils/error.utils';
import { RESOURCE_COLORS, DEFAULT_COLOR } from '../../constants/resource.constants';
import { ResourceService } from '../services/resource.service';

// Maximum de caractères pour les champs
const MAX_TITLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_CONTENT_LENGTH = 2000;

// Définir les structures pour les couleurs
const ResourceColorIds = RESOURCE_COLORS.map(color => ({
  id: color.value,
  name: color.label,
  description: color.description || color.label,
  emoji: color.label.split(' ')[0]
}));

/**
 * Ouvre le modal de création de ressource via API
 */
export async function openResourceApiModal(interaction: ButtonInteraction): Promise<void> {
  try {
    logDebug('Resource API', `Ouverture du modal de création de ressource API pour ${interaction.user.tag}`);
    
    // Créer un modal pour la saisie des informations de la ressource
    const modal = new ModalBuilder()
      .setCustomId('resource_api_modal')
      .setTitle('Créer une nouvelle ressource');

    // Champ pour le titre
    const titleInput = new TextInputBuilder()
      .setCustomId('title')
      .setLabel('Titre de la ressource')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Guide TypeScript pour débutants')
      .setRequired(true)
      .setMaxLength(MAX_TITLE_LENGTH);

    // Champ pour la description
    const descriptionInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('Description de la ressource')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Description courte de la ressource...')
      .setRequired(true)
      .setMaxLength(MAX_DESCRIPTION_LENGTH);
      
    // Champ pour le contenu
    const contentInput = new TextInputBuilder()
      .setCustomId('content')
      .setLabel('Contenu de la ressource')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Contenu détaillé de la ressource...')
      .setRequired(true)
      .setMaxLength(MAX_CONTENT_LENGTH);

    // Création des lignes du formulaire
    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
    const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
    const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput);

    // Ajout des composants au modal
    modal.addComponents(firstRow, secondRow, thirdRow);

    // Afficher le modal
    await interaction.showModal(modal);
    logDebug('Resource API', 'Modal de création affiché avec succès');
  } catch (error) {
    logError('Resource API Modal', error);
    try {
      await interaction.reply({
        content: 'Une erreur est survenue lors de l\'ouverture du formulaire.',
        ephemeral: true
      });
    } catch (replyError) {
      logError('Resource API Modal Reply', replyError);
    }
  }
}

/**
 * Gère la soumission du modal de création de ressource API
 */
export async function handleResourceApiModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  try {
    logDebug('Resource API Modal Submit', { userId: interaction.user.id });
    
    // Récupérer les valeurs des champs
    const title = interaction.fields.getTextInputValue('title');
    const description = interaction.fields.getTextInputValue('description');
    const url = interaction.fields.getTextInputValue('content');
    
    // Utiliser MemberService pour récupérer le premier guild ID de l'utilisateur
    const memberService = MemberService.getInstance();
    const guildId = await memberService.getFirstGuildIdForUser(interaction.user.id);
    
    if (!guildId) {
      logError('No Guild ID Found', { userId: interaction.user.id });
      await interaction.reply({
        content: "Je ne trouve pas de serveur associé à votre compte. Veuillez d'abord rejoindre un serveur.",
        ephemeral: true
      });
      return;
    }
    
    logDebug('Using Guild ID', { guildId, userId: interaction.user.id });
    
    // Seulement demander la couleur, sans étape de tags
    const colorRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('resource_color_select')
          .setPlaceholder('Sélectionner une couleur')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            ...ResourceColorIds.map(color => {
              return new StringSelectMenuOptionBuilder()
                .setLabel(color.name)
                .setValue(color.id)
                .setDescription(color.description)
                .setEmoji(color.emoji);
            })
          )
      );
    
    // Ajouter un bouton pour valider directement sans étape de tag
    const validateButton = new ButtonBuilder()
      .setCustomId('post_resource')
      .setLabel('Publier la ressource')
      .setStyle(ButtonStyle.Success)
      .setEmoji('📝');

    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(validateButton);
    
    // Stocker temporairement les données
    const tempStorage = TempStorageService.getInstance();
    tempStorage.setResourceData(interaction.user.id, {
      title,
      description,
      color: RESOURCE_COLORS[0].value, // Utiliser la couleur par défaut
      userId: interaction.user.id,
      timestamp: Date.now(),
      url,
      guildId,  // Stocke également le guildId dans les données temporaires
      selectedTags: [] // Aucun tag sélectionné par défaut
    });
    
    logDebug('Temp Data Stored', { 
      userId: interaction.user.id, 
      title,
      guildId
    });
    
    // Envoyer uniquement le menu de sélection de couleur et le bouton de validation
    await interaction.reply({
      content: 'Votre ressource a bien été préparée ! Veuillez sélectionner une couleur, puis cliquez sur "Publier la ressource" :',
      components: [colorRow, buttonRow],
      ephemeral: true
    });
    
  } catch (error) {
    logError('Handle Resource API Modal Submit', error);
    await interaction.reply({
      content: 'Une erreur est survenue lors du traitement du formulaire.',
      ephemeral: true
    });
  }
} 