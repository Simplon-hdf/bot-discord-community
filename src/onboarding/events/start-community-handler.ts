import { ButtonInteraction } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { sendUserDashboard } from '../../dashboard/events/dashboard-handler';
import { OnboardingService } from '../services/onboarding-service';

/**
 * Gère l'interaction avec le bouton "start_community"
 * Ce bouton permet à un utilisateur de démarrer son intégration à la communauté
 */
export async function handleStartCommunityButton(interaction: ButtonInteraction) {
  try {
    logDebug('Start Community', `Bouton cliqué par ${interaction.user.tag}`);
    
    // Référence à la guild et au membre
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Une erreur est survenue: impossible d\'identifier le serveur.',
        ephemeral: true
      });
      return;
    }
    
    const member = await guild.members.fetch(interaction.user.id);
    const onboardingService = OnboardingService.getInstance();
    
    // Vérifier d'abord si l'utilisateur est déjà membre de la communauté
    const isMember = await onboardingService.isUserAlreadyMember(interaction.user.id, guild.id);
    
    if (isMember) {
      // L'utilisateur est déjà membre, informer sans resynchroniser
      await interaction.reply({
        content: '⚠️ Vous êtes déjà membre de la communauté. Pas besoin de vous inscrire à nouveau.',
        ephemeral: true
      });
      return;
    }
    
    // L'utilisateur n'est pas encore membre, procéder à la synchronisation
    await interaction.reply({
      content: '⏳ Création de votre profil...',
      ephemeral: true
    });
    
    try {
      // Synchroniser le membre via le service d'onboarding
      const success = await onboardingService.syncMember(member);
      
      if (!success) {
        throw new Error("Échec de la synchronisation du membre");
      }
      
      logDebug('Member Sync', `Membre synchronisé avec succès: ${interaction.user.tag}`);
      
      // Envoyer le tableau de bord
      const dashboardSent = await sendUserDashboard(
        interaction.user, 
        interaction.client,
        interaction.guild?.id
      );
      
      if (dashboardSent) {
        await interaction.editReply({
          content: '✅ Votre aventure commence ! Vous êtes maintenant membre officiel de la communauté et votre tableau de bord personnel a été envoyé en message privé.',
        });
      } else {
        await interaction.editReply({
          content: '✅ Votre aventure commence ! Vous êtes maintenant membre officiel de la communauté. Nous n\'avons pas pu vous envoyer de message privé. Vérifiez vos paramètres de confidentialité.',
        });
      }
    } catch (syncError) {
      logError('Member Sync', syncError);
      await interaction.editReply({
        content: '❌ Une erreur est survenue lors de la création de votre profil. Veuillez réessayer plus tard.',
      });
    }
  } catch (error) {
    logError('Start Community Button', error);
    try {
      await interaction.reply({
        content: 'Une erreur est survenue. Veuillez réessayer plus tard.',
        ephemeral: true
      });
    } catch (replyError) {
      // Probablement déjà répondu
    }
  }
} 