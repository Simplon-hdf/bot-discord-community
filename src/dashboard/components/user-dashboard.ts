import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, User } from 'discord.js';
import { UserProfileService } from '../../user/services/user-profile.service';

// Couleur Simplon pour la cohérence visuelle
const SIMPLON_COLOR = 0x00313C;

export function createUserDashboardEmbed(user: User): EmbedBuilder {
  const profileService = UserProfileService.getInstance();
  const profile = profileService.getOrCreateProfile(user);
  
  // Calculer la progression vers le niveau suivant
  const currentLevelXP = profileService.getXPForNextLevel(profile.level - 1);
  const nextLevelXP = profileService.getXPForNextLevel(profile.level);
  const xpProgress = profile.xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPercentage = Math.floor((xpProgress / xpNeeded) * 100);
  
  // Créer la barre de progression
  const progressBar = createProgressBar(progressPercentage);
  
  // Créer l'embed du tableau de bord
  return new EmbedBuilder()
    .setColor(SIMPLON_COLOR)
    .setTitle('📊 Tableau de Bord Personnel')
    .setDescription(`Bienvenue sur ton espace personnel, ${user}! Voici un résumé de ton activité dans la communauté.`)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      {
        name: '📈 Niveau et Progression',
        value: `Niveau: **${profile.level}**\nXP: **${profile.xp}** points\n${progressBar}\n*${xpProgress}/${xpNeeded} XP pour le niveau ${profile.level + 1}*`,
        inline: false
      },
      {
        name: '🏆 Badges',
        value: profile.badges.length > 0 
          ? profile.badges.join(', ') 
          : "*Tu n'as pas encore de badges. Participe pour en gagner!*",
        inline: false
      },
      {
        name: '📚 Ressources partagées',
        value: `**${profile.resourcesShared}** ressources\n*+50 XP par ressource partagée*`,
        inline: true
      },
      {
        name: '👍 Votes donnés',
        value: `**${profile.resourcesVoted}** votes\n*+10 XP par vote*`,
        inline: true
      },
      {
        name: '⏱️ Activité',
        value: `Membre depuis: <t:${Math.floor(profile.joinedAt.getTime() / 1000)}:R>\nDernière activité: <t:${Math.floor(profile.lastActive.getTime() / 1000)}:R>`,
        inline: false
      }
    )
    .setFooter({
      text: 'Communauté Simplon • Partage et évolue!',
      iconURL: 'https://evenement.simplon.co/hs-fs/hubfs/SIMPLON_LOGO_2024%20(1).png?width=1920&height=592&name=SIMPLON_LOGO_2024%20(1).png'
    })
    .setTimestamp();
}

export function createDashboardButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('create_resource_dashboard')
        .setLabel('Partager une ressource')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('📚'),
      new ButtonBuilder()
        .setCustomId('view_leaderboard')
        .setLabel('Classement')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🏅'),
      new ButtonBuilder()
        .setCustomId('refresh_dashboard')
        .setLabel('Actualiser')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔄')
    );
}

export function createUserDashboard(user: User) {
  return {
    embeds: [createUserDashboardEmbed(user)],
    components: [createDashboardButtons()]
  };
}

// Fonction pour créer une barre de progression visuelle
function createProgressBar(percentage: number): string {
  const filledBlocks = Math.floor(percentage / 10);
  const emptyBlocks = 10 - filledBlocks;
  
  const filled = '🟩'.repeat(filledBlocks);
  const empty = '⬜'.repeat(emptyBlocks);
  
  return `${filled}${empty} ${percentage}%`;
} 