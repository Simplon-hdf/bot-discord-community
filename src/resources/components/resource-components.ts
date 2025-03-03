import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
  User,
  GuildMember,
  APIInteractionGuildMember
} from 'discord.js';
import { COLORS, RESOURCE_COLORS } from '../../shared/constants/ui.constants';
import { FORM_LIMITS } from '../../shared/constants/forms.constants';
import { RESOURCE_IDS } from '../../shared/constants/ids.constants';
import { logDebug } from '../../utils/error.utils';

// Constantes pour les limites de caractères
export const MAX_TITLE_LENGTH = FORM_LIMITS.RESOURCE_TITLE_MAX;
export const MAX_DESCRIPTION_LENGTH = FORM_LIMITS.RESOURCE_DESCRIPTION_MAX;
export const MAX_CONTENT_LENGTH = FORM_LIMITS.RESOURCE_CONTENT_MAX;

// Définir les structures pour les couleurs
export const ResourceColorIds = RESOURCE_COLORS.map(color => ({
  id: color.value,
  name: color.label,
  description: color.description || color.label,
  emoji: color.label.split(' ')[0]
}));

/**
 * Récupère le nom d'affichage d'un utilisateur (nickname ou username)
 */
function getDisplayName(
  guildMember: GuildMember | APIInteractionGuildMember | null | undefined, 
  user: User | undefined
): string {
  if (!user) return "Utilisateur";
  if (!guildMember) return user.username;
  
  // APIInteractionGuildMember utilise user.username
  // GuildMember utilise nickname
  // À partir de discord.js v14, APIInteractionGuildMember n'a pas directement nickname
  if ('nickname' in guildMember && guildMember.nickname) {
    return guildMember.nickname;
  }
  
  // Fallback sur le username
  return user.username;
}

/**
 * Récupère le nickname d'un membre pour le logging, de façon sécurisée
 */
function getSafeNickname(guildMember: GuildMember | APIInteractionGuildMember | null | undefined): string {
  if (!guildMember) return "non défini";
  if ('nickname' in guildMember) {
    return guildMember.nickname || "non défini";
  }
  return "non disponible";
}

/**
 * Crée un modal pour la création d'une nouvelle ressource
 */
export function createResourceModal(): ModalBuilder {
  // Créer un modal pour la saisie des informations de la ressource
  const modal = new ModalBuilder()
    .setCustomId(RESOURCE_IDS.MODAL_CREATE)
    .setTitle('Créer une nouvelle ressource');

  // Champ pour le titre
  const titleInput = new TextInputBuilder()
    .setCustomId('title')
    .setLabel(`Titre de la ressource (max ${MAX_TITLE_LENGTH} caractères)`)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: Guide TypeScript pour débutants')
    .setRequired(true)
    .setMinLength(5)
    .setMaxLength(MAX_TITLE_LENGTH);

  // Champ pour la description
  const descriptionInput = new TextInputBuilder()
    .setCustomId('description')
    .setLabel(`Description brève (max ${MAX_DESCRIPTION_LENGTH} caractères)`)
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Une courte description de la ressource...')
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(MAX_DESCRIPTION_LENGTH);

  // Champ pour le contenu (lien ou texte)
  const contentInput = new TextInputBuilder()
    .setCustomId('content')
    .setLabel(`Contenu (max ${MAX_CONTENT_LENGTH} caractères)`)
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('URL de la ressource ou texte du contenu...')
    .setRequired(true)
    .setMinLength(5)
    .setMaxLength(MAX_CONTENT_LENGTH);

  // Ajouter les composants au modal
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput)
  );

  return modal;
}

/**
 * Crée un menu de sélection pour les couleurs de ressource
 */
export function createColorSelectMenu(): ActionRowBuilder<StringSelectMenuBuilder> {
  const colorOptions = ResourceColorIds.map(color => 
    new StringSelectMenuOptionBuilder()
      .setLabel(color.name)
      .setDescription(color.description)
      .setValue(color.id)
      .setEmoji(color.emoji)
  );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(RESOURCE_IDS.SELECT_COLOR)
    .setPlaceholder('Choisissez une couleur pour votre ressource')
    .addOptions(colorOptions);

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
}

/**
 * Crée un embed pour la confirmation de création de ressource
 */
export function createResourceConfirmEmbed(
  title: string, 
  description: string, 
  color: string = COLORS.DEFAULT,
  author?: User,
  guildMember?: GuildMember | APIInteractionGuildMember | null
): EmbedBuilder {
  // Utiliser le nickname s'il existe, sinon utiliser le username
  const displayName = getDisplayName(guildMember, author);
  
  const embed = new EmbedBuilder()
    .setTitle('✅ Ressource créée avec succès!')
    .setDescription(`Votre ressource **${title}** a été publiée.`)
    .setColor(`#${color}`)
    .addFields(
      { name: '📄 Description', value: description },
      { 
        name: '🔍 Que se passe-t-il maintenant ?', 
        value: '• Votre ressource est maintenant visible par la communauté\n• Les membres peuvent y accéder et l\'évaluer\n• Vous gagnez de l\'expérience pour votre contribution'
      }
    )
    .setTimestamp();
  
  // Ajouter l'auteur s'il est disponible
  if (author) {
    embed.setThumbnail(author.displayAvatarURL({ size: 128 }));
  }
  
  // Ajouter le logo Simplon dans le footer
  embed.setFooter({ 
    text: `Merci de contribuer à la communauté Simplon, ${displayName} !`, // Inclure le nickname dans le remerciement
    iconURL: 'https://evenement.simplon.co/hs-fs/hubfs/SIMPLON_LOGO_2024%20(1).png?width=1920&height=592&name=SIMPLON_LOGO_2024%20(1).png'
  });
  
  return embed;
}

/**
 * Crée un embed pour l'affichage d'une ressource
 */
export function createResourceDisplayEmbed(
  title: string, 
  description: string, 
  content: string, 
  author: User, 
  tags: string[] = [], 
  color: string = COLORS.DEFAULT,
  guildMember?: GuildMember | APIInteractionGuildMember | null
): EmbedBuilder {
  // Utiliser le nickname s'il existe, sinon utiliser le username
  const displayName = getDisplayName(guildMember, author);
  
  // Pour déboggage - vérifier les valeurs exactes
  console.log(`[ResourceDisplayEmbed] DisplayName='${displayName}', Author.username='${author.username}'`);
  console.log(`[ResourceDisplayEmbed] Nickname='${getSafeNickname(guildMember)}'`);
  
  // Créer un embed plus attrayant visuellement
  const embed = new EmbedBuilder()
    .setTitle(`📌 ${title.toUpperCase()}`)
    .setDescription(`\n${description}\n`)
    .setColor(`#${color}`)
    .setTimestamp()
    // Garder l'image de profil en haut à droite
    .setThumbnail(author.displayAvatarURL({ size: 128 }));
    // Supprimer seulement la partie auteur
  
  // Ajouter le contenu de manière plus proéminente
  if (content.startsWith('http')) {
    embed.setURL(content);
    embed.addFields({ 
      name: '🔗 LIEN DE LA RESSOURCE',
      value: `**${content}**`
    });
  } else {
    embed.addFields({ 
      name: '📄 CONTENU DE LA RESSOURCE',
      value: `\`\`\`\n${content}\n\`\`\``
    });
  }
  
  // Ajouter les informations secondaires dans un champ replié
  embed.addFields({ 
    name: '👤 Informations sur le contributeur', 
    value: `**Niveau:** ⭐ à venir\n**Badges:** 🏆 à venir\n**Contributions:** 📚 à venir`,
    inline: true
  });
  
  // Ajouter la date de création formatée
  const now = new Date();
  const formattedDate = `${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`;
  const detailsValue = `**Créé le:** ${formattedDate}\n**ID:** ${author.id}`;
  
  embed.addFields({ 
    name: '📋 Détails', 
    value: detailsValue,
    inline: true
  });
  
  // Garder le logo Simplon dans le footer
  embed.setFooter({ 
    text: `Communauté Simplon`,
    iconURL: 'https://evenement.simplon.co/hs-fs/hubfs/SIMPLON_LOGO_2024%20(1).png?width=1920&height=592&name=SIMPLON_LOGO_2024%20(1).png'
  });
  
  return embed;
}

/**
 * Crée un embed pour l'aperçu d'une ressource pendant la création
 */
export function createResourcePreviewEmbed(
  title: string, 
  description: string, 
  content: string, 
  color: string = COLORS.DEFAULT,
  author: User,
  guildMember?: GuildMember | APIInteractionGuildMember | null
): EmbedBuilder {
  // Utiliser le nickname s'il existe, sinon utiliser le username
  const displayName = getDisplayName(guildMember, author);
  
  // Pour déboggage - vérifier les valeurs exactes
  console.log(`[ResourcePreviewEmbed] DisplayName='${displayName}', Author.username='${author.username}'`);
  console.log(`[ResourcePreviewEmbed] Nickname='${getSafeNickname(guildMember)}'`);
  
  const embed = new EmbedBuilder()
    .setTitle(`📝 APERÇU: ${title.toUpperCase()}`)
    .setDescription(`\n${description}\n`)
    .setColor(`#${color}`)
    .setTimestamp()
    // Ajouter l'image de profil en haut à droite
    .setThumbnail(author.displayAvatarURL({ size: 128 }))
    // Ajouter des informations sur l'auteur
    .setAuthor({ 
      name: displayName, // Utiliser le nickname au lieu du username
      iconURL: author.displayAvatarURL(),
      url: `https://discord.com/users/${author.id}`
    });
  
  // Ajouter le contenu de manière plus proéminente
  if (content.startsWith('http')) {
    embed.setURL(content);
    embed.addFields({ 
      name: '🔗 LIEN DE LA RESSOURCE',
      value: `**${content}**` 
    });
  } else {
    embed.addFields({ 
      name: '📄 CONTENU DE LA RESSOURCE',
      value: content.length > 300 
        ? `\`\`\`\n${content.substring(0, 297)}...\n\`\`\`` 
        : `\`\`\`\n${content}\n\`\`\``
    });
  }
  
  // Ajouter un champ pour le niveau et les badges (à venir)
  embed.addFields({ 
    name: '👤 Informations sur le contributeur (aperçu)', 
    value: `**Niveau:** ⭐ à venir\n**Badges:** 🏆 à venir\n**Contributions:** 📚 à venir`,
    inline: true
  });
  
  // Ajouter un bandeau de prévisualisation
  embed.addFields({
    name: '📋 STATUT',
    value: '**⚠️ CECI EST UN APERÇU - LA RESSOURCE N\'A PAS ENCORE ÉTÉ PUBLIÉE ⚠️**',
    inline: false
  });
  
  // Ajouter le footer à la fin
  embed.setFooter({ 
    text: `Aperçu - Sera partagé par ${displayName} • Communauté Simplon`, // Utiliser le nickname
    iconURL: 'https://evenement.simplon.co/hs-fs/hubfs/SIMPLON_LOGO_2024%20(1).png?width=1920&height=592&name=SIMPLON_LOGO_2024%20(1).png' 
  });
  
  return embed;
} 