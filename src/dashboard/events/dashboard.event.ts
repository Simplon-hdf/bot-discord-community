import { ButtonInteraction, Client, User } from 'discord.js';
import { createUserDashboard } from '../components/user-dashboard';
import { UserProfileService } from '../../user/services/user-profile.service';
import { logDebug, logError } from '../../utils/error.utils';
import { openResourceApiModal } from '../../resources/events/api-modal-interactions';
import { TempStorageService } from '../../resources/services/temp-storage.service';

export async function sendUserDashboard(user: User, client: Client, guildId?: string): Promise<boolean> {
  try {
    logDebug('Dashboard', `Envoi du tableau de bord à ${user.tag}`);
    
    // S'assurer que le profil utilisateur existe
    const profileService = UserProfileService.getInstance();
    profileService.getOrCreateProfile(user);
    
    // Nous n'avons plus besoin de stocker temporairement le guildId
    // car il est déjà persisté en base de données lorsqu'un utilisateur rejoint un serveur
    
    // Créer le dashboard
    const dashboard = createUserDashboard(user);
    
    // Envoyer en MP
    await user.send(dashboard);
    logDebug('Dashboard', `Tableau de bord envoyé avec succès à ${user.tag}`);
    
    return true;
  } catch (error) {
    logError('Dashboard', `Erreur lors de l'envoi du tableau de bord à ${user.tag}: ${error}`);
    return false;
  }
}

export async function handleDashboardInteraction(interaction: ButtonInteraction): Promise<void> {
  try {
    const { customId, user } = interaction;
    
    switch (customId) {
      case 'refresh_dashboard':
        // Actualiser le dashboard
        await interaction.update(createUserDashboard(user));
        logDebug('Dashboard', `Dashboard actualisé pour ${user.tag}`);
        break;
        
      case 'view_leaderboard':
        // Afficher le classement
        const profileService = UserProfileService.getInstance();
        const topUsers = profileService.getUserRanking(10);
        
        let leaderboardText = "🏆 **Classement des membres** 🏆\n\n";
        
        if (topUsers.length === 0) {
          leaderboardText += "*Aucun utilisateur dans le classement pour le moment.*";
        } else {
          topUsers.forEach((profile, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            leaderboardText += `${medal} **${profile.username}** - Niveau ${profile.level} (${profile.xp} XP)\n`;
          });
        }
        
        await interaction.reply({
          content: leaderboardText,
          ephemeral: true
        });
        logDebug('Dashboard', `Classement affiché pour ${user.tag}`);
        break;
        
      case 'create_resource_dashboard':
        // Ouvrir le modal de création de ressource API
        await openResourceApiModal(interaction);
        logDebug('Dashboard', `Modal de création de ressource API ouvert pour ${user.tag}`);
        break;
        
      default:
        logDebug('Dashboard', `Interaction inconnue: ${customId}`);
        await interaction.reply({
          content: "❓ Cette fonctionnalité n'est pas encore disponible.",
          ephemeral: true
        });
    }
  } catch (error) {
    logError('Dashboard', `Erreur dans le gestionnaire d'interaction: ${error}`);
    
    try {
      await interaction.reply({
        content: "Une erreur est survenue. Veuillez réessayer plus tard.",
        ephemeral: true
      });
    } catch (replyError) {
      // Déjà répondu, essayer de mettre à jour
      try {
        await interaction.followUp({
          content: "Une erreur est survenue. Veuillez réessayer plus tard.",
          ephemeral: true
        });
      } catch (followUpError) {
        logError('Dashboard', `Impossible de répondre à l'interaction: ${followUpError}`);
      }
    }
  }
} 