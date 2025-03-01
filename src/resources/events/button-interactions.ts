import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, DiscordAPIError } from 'discord.js';
import { ResourceService } from '../services/resource.service';
import { TempStorageService } from '../services/temp-storage.service';
import { ResourceApiService } from '../../api/services/resource.service';
import { MemberService } from '../../members/services/member.service';
import { TagService } from '../../tag/services/tag.service';
import { logDebug, logError } from '../../utils/error.utils';
import { RESOURCE_COLORS, DEFAULT_COLOR, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from '../../constants/resource.constants';
import { UserProfileService } from '../../user/services/user-profile.service';
import { USER_BADGES, XP_REWARDS } from '../../user/types/user.types';

const RESOURCE_TAGS = [
  { label: '📚 Documentation', value: 'documentation' },
  { label: '🎓 Tutoriel', value: 'tutorial' },
  { label: '🛠️ Outil', value: 'tool' },
  { label: '📝 Article', value: 'article' },
  { label: '🎥 Vidéo', value: 'video' },
  { label: '⚡ Astuce', value: 'tip' },
  { label: '🎯 Bonne pratique', value: 'best_practice' },
  { label: '🔗 Lien utile', value: 'useful_link' }
];

export async function handleCreateTagButton(interaction: ButtonInteraction) {
  if (interaction.customId !== 'create_tag') {
    return false;
  }

  logDebug('Create Tag', `Bouton de création de tag cliqué par ${interaction.user.tag}`);

  // Créer un modal pour saisir les informations du tag
  const modal = new ModalBuilder()
    .setCustomId('tag_creation_modal')
    .setTitle('Créer un nouveau tag');

  // Champ pour le nom du tag
  const nameInput = new TextInputBuilder()
    .setCustomId('tag_name')
    .setLabel('Nom du tag')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('ex: JavaScript, Docker, React...')
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(25);

  // Champ pour la description du tag
  const descriptionInput = new TextInputBuilder()
    .setCustomId('tag_description')
    .setLabel('Description (optionnelle)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Décrivez brièvement ce tag')
    .setRequired(false)
    .setMaxLength(100);

  // Ajouter les champs au modal
  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
  modal.addComponents(firstRow, secondRow);

  // Afficher le modal
  await interaction.showModal(modal);
  logDebug('Create Tag', 'Modal de création de tag affiché');
  
  return true;
}

export async function handleResourceButtonInteraction(interaction: ButtonInteraction) {
  if (interaction.customId === 'create_resource') {
    logDebug('Button Click', `Bouton "Créer une ressource" cliqué par ${interaction.user.tag}`);
    
    try {
      // Créer un modal pour la saisie des informations de la ressource
      const modal = new ModalBuilder()
        .setCustomId('resource_creation_modal')
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
        .setPlaceholder('Décrivez votre ressource...')
        .setRequired(true)
        .setMaxLength(MAX_DESCRIPTION_LENGTH);

      const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
      const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);

      modal.addComponents(firstRow, secondRow);

      logDebug('Modal', 'Tentative d\'affichage du modal...');
      await interaction.showModal(modal);
      logDebug('Modal', 'Modal affiché avec succès');
    } catch (error) {
      logError('Modal Display', error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de l\'ouverture du formulaire. Veuillez réessayer.',
        ephemeral: true
      });
    }
  }
  else if (interaction.customId === 'post_resource') {
    logDebug('Resource Button', `Bouton de publication cliqué par ${interaction.user.tag}`);
    
    const tempStorage = TempStorageService.getInstance();
    const tempData = tempStorage.getResourceData(interaction.user.id);
    
    if (!tempData) {
      await interaction.reply({
        content: '❌ Erreur : Données non trouvées. Veuillez recommencer la création de la ressource.',
        ephemeral: true
      });
      return;
    }
    
    // Vérifier que tous les champs requis sont remplis
    if (!tempData.title || !tempData.description || !tempData.selectedTags || tempData.selectedTags.length === 0) {
      await interaction.reply({
        content: '❌ Erreur : Informations incomplètes. Assurez-vous de remplir tous les champs et de sélectionner au moins un tag.',
        ephemeral: true
      });
      return;
    }

    // Démarrer le processus de création
    await interaction.deferReply({ ephemeral: true });
    
    logDebug('Resource Creation', tempData);
    
    try {
      const resourceService = ResourceService.getInstance();
      const memberService = MemberService.getInstance();
      const tagService = TagService.getInstance();
      
      // Récupérer les noms des tags pour l'affichage
      const tagNames = await tagService.getTagNamesByIds(tempData.selectedTags);
      
      const resourceData = {
        title: tempData.title,
        author: interaction.user.username,
        tags: tagNames,
        color: tempData.color || DEFAULT_COLOR
      };
      
      logDebug('Création de ressource', resourceData);
      
      // Créer la ressource dans Discord
      const result = await resourceService.createResource(
        interaction.client,
        tempData.title,
        tempData.description,
        interaction.user,
        tagNames,
        tempData.color || DEFAULT_COLOR
      );
      
      logDebug('Ressource créée avec succès', {
        threadId: result.id,
        url: result.url
      });
      
      // Sauvegarder dans l'API
      try {
        // Récupérer le member UUID depuis l'API
        const guildId = tempData.guildId;
        if (!guildId) {
          throw new Error('Guild ID manquant dans les données temporaires');
        }
        const member = await memberService.getMember(interaction.user.id, guildId);
        
        if (member) {
          const resourceApiService = ResourceApiService.getInstance();
          const resourceData = {
            uuidMember: member.uuidMember,
            title: tempData.title,
            description: tempData.description,
            content: tempData.url || result.url,
            status: 'active',
            tagUuids: tempData.selectedTags
          };
          
          logDebug('Create Resource', { data: resourceData });
          await resourceApiService.createResource(resourceData);
          logDebug('Resource Creation', `Ressource créée avec succès: ${result.url}`);
        } else {
          logError('Resource Creation', `Impossible de trouver le membre pour l'utilisateur ${interaction.user.id} dans le serveur ${guildId}`);
        }
      } catch (apiError) {
        logError('API Resource Creation', apiError);
      }
      
      // Incrémenter les statistiques de l'utilisateur
      const userProfileService = UserProfileService.getInstance();
      userProfileService.incrementResourcesShared(interaction.user.id);
      userProfileService.addXP(interaction.user.id, XP_REWARDS.SHARE_RESOURCE);
      
      // Nettoyer les données temporaires
      tempStorage.deleteResourceData(interaction.user.id);
      
      // Répondre à l'utilisateur
      await interaction.editReply({
        content: `✅ Votre ressource a été créée avec succès ! Vous pouvez la consulter ici : ${result.url}`
      });
    } catch (error) {
      logError('Resource Creation', error);
      await interaction.editReply({
        content: 'Une erreur est survenue lors de la création de la ressource. Veuillez réessayer plus tard.'
      });
    }
  }
  else if (interaction.customId === 'reset_resource') {
    const tempStorage = TempStorageService.getInstance();
    tempStorage.deleteResourceData(interaction.user.id);

    await interaction.update({
      content: '🔄 Configuration réinitialisée. Vous pouvez recommencer la création de votre ressource.',
      components: []
    });
  }

  // Gérer le bouton de création de tag
  if (await handleCreateTagButton(interaction)) {
    return;
  }
} 