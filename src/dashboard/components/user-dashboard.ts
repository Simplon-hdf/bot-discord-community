import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, User } from 'discord.js';
import { DashboardService } from '../services/dashboard-service';

// Couleur Simplon pour la cohérence visuelle
const SIMPLON_COLOR = 0x00313C;

export async function createUserDashboardEmbed(user: User): Promise<EmbedBuilder> {
  const dashboardService = DashboardService.getInstance();
  const profile = await dashboardService.getUserProfile(user);
  
  // Créer l'embed du tableau de bord simplifié
  return new EmbedBuilder()
    .setColor(SIMPLON_COLOR)
    .setTitle('📊 Tableau de Bord Personnel')
    .setDescription(`Bienvenue sur ton espace personnel, ${user}! Voici une présentation de notre communauté.`)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      {
        name: '🌟 Bienvenue dans la communauté Simplon',
        value: 'Tu fais partie d\'un espace d\'entraide et de partage de connaissances dédié aux développeurs de l\'écosystème Simplon.',
        inline: false
      },
      {
        name: '📚 Ressources partagées',
        value: 'Explore les ressources partagées par les membres de la communauté. Bientôt, tu pourras également partager tes propres découvertes!',
        inline: false
      },
      {
        name: '🔗 Interactions',
        value: 'Connecte-toi avec d\'autres membres, participe aux discussions et échange sur les bonnes pratiques de développement.',
        inline: false 
      },
      {
        name: '🗓️ Membre depuis',
        value: `<t:${Math.floor(profile.joinedAt.getTime() / 1000)}:R>`,
        inline: true
      }
    )
    .setFooter({ 
      text: 'Communauté Simplon', 
      iconURL: 'https://evenement.simplon.co/hs-fs/hubfs/SIMPLON_LOGO_2024%20(1).png?width=1920&height=592&name=SIMPLON_LOGO_2024%20(1).png' 
    });
}

export function createDashboardButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('refresh_dashboard')
        .setLabel('Actualiser')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔄'),
      new ButtonBuilder()
        .setCustomId('view_community')
        .setLabel('Membres')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('👥'),
      new ButtonBuilder()
        .setCustomId('create_resource_dashboard')
        .setLabel('Partager une ressource')
        .setStyle(ButtonStyle.Success)
        .setEmoji('📚')
    );
}

export async function createUserDashboard(user: User) {
  return {
    embeds: [await createUserDashboardEmbed(user)],
    components: [createDashboardButtons()]
  };
} 