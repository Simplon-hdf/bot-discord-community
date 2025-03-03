import { ButtonInteraction, Client, User } from 'discord.js';
import { createUserDashboard } from '../components/user-dashboard';
import { DashboardService } from '../services/dashboard-service';
import { logDebug, logError } from '../../utils/error.utils';
import { EventBus, EventType, EventPayload } from '../../core/events/event-bus';

/**
 * Envoie le tableau de bord personnel à un utilisateur
 */
export async function sendUserDashboard(user: User, client: Client, guildId?: string): Promise<boolean> {
  try {
    logDebug('Dashboard', `Envoi du tableau de bord à ${user.tag}`);
    
    // Utiliser directement le service dashboard qui communique avec l'API
    const dashboardService = DashboardService.getInstance();
    
    // Créer le dashboard
    const dashboard = await createUserDashboard(user);
    
    // Envoyer en MP
    await user.send(dashboard);
    logDebug('Dashboard', `Tableau de bord envoyé avec succès à ${user.tag}`);
    
    return true;
  } catch (error) {
    logError('Dashboard', `Erreur lors de l'envoi du tableau de bord à ${user.tag}: ${error}`);
    return false;
  }
}

/**
 * Gère les interactions avec les boutons du tableau de bord
 */
export async function handleDashboardInteraction(interaction: ButtonInteraction): Promise<void> {
  try {
    const { customId, user } = interaction;
    
    switch (customId) {
      case 'refresh_dashboard':
        // Actualiser le dashboard
        await interaction.update(await createUserDashboard(user));
        logDebug('Dashboard', `Dashboard actualisé pour ${user.tag}`);
        break;
        
      case 'view_community':
        // Afficher la liste des membres
        const dashboardService = DashboardService.getInstance();
        const members = await dashboardService.getCommunityMembers(10);
        
        let communityText = "👥 **Membres de la communauté** 👥\n\n";
        
        if (members.length === 0) {
          communityText += "*Aucun membre n'a encore rejoint la communauté.*";
        } else {
          members.forEach((profile, index) => {
            communityText += `${index + 1}. **${profile.username}** • Membre depuis <t:${Math.floor(profile.joinedAt.getTime() / 1000)}:R>\n`;
          });
        }
        
        await interaction.reply({
          content: communityText,
          ephemeral: true
        });
        
        logDebug('Dashboard', `Liste des membres affichée pour ${user.tag}`);
        break;
        
      case 'create_resource_dashboard':
        // Utiliser l'Event Bus au lieu de l'appel direct
        const eventBus = EventBus.getInstance();
        eventBus.publish(EventType.CREATE_RESOURCE_REQUESTED, { interaction });
        logDebug('Dashboard', `Événement de création de ressource publié pour ${user.tag}`);
        break;
        
      default:
        logError('Dashboard', `Bouton non reconnu: ${customId}`);
        await interaction.reply({
          content: 'Cette action n\'est pas prise en charge actuellement.',
          ephemeral: true
        });
    }
  } catch (error) {
    logError('Dashboard Interaction', error);
    try {
      await interaction.reply({
        content: 'Une erreur est survenue lors du traitement de cette action.',
        ephemeral: true
      });
    } catch (replyError) {
      // Si l'interaction a déjà reçu une réponse, utiliser followUp
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue lors du traitement de cette action.',
          ephemeral: true
        });
      }
    }
  }
}

/**
 * Gère les interactions avec le bouton "Voir mon tableau de bord"
 */
export async function handleViewDashboardButton(interaction: ButtonInteraction, client: Client): Promise<void> {
  try {
    logDebug('Dashboard', `Interaction avec le bouton "Voir mon tableau de bord" par ${interaction.user.tag}`);
    
    // Envoyer une réponse temporaire
    await interaction.reply({
      content: "📊 Je vous envoie votre tableau de bord par message privé...",
      ephemeral: true
    });
    
    // Tenter d'envoyer le dashboard en MP
    const dashboardSent = await sendUserDashboard(interaction.user, client);
    
    if (!dashboardSent) {
      // Si l'envoi a échoué, informer l'utilisateur
      await interaction.followUp({
        content: "❌ Je n'ai pas pu vous envoyer votre tableau de bord. Vérifiez que vous autorisez les messages privés des membres du serveur.",
        ephemeral: true
      });
    }
  } catch (error) {
    logError('Dashboard Button', error);
    try {
      await interaction.reply({
        content: "Une erreur est survenue lors de l'envoi de votre tableau de bord.",
        ephemeral: true
      });
    } catch (replyError) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "Une erreur est survenue lors de l'envoi de votre tableau de bord.",
          ephemeral: true
        });
      }
    }
  }
} 