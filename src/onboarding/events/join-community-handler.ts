import { ButtonInteraction, ButtonStyle, EmbedBuilder, ActionRowBuilder, ButtonBuilder } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { sendUserDashboard } from '../../dashboard/events/dashboard-handler';
import { OnboardingService } from '../services/onboarding-service';

export async function handleJoinCommunityButton(interaction: ButtonInteraction) {
  if (interaction.customId === 'join_community') {
    try {
      await interaction.deferReply({ ephemeral: true });
      const onboardingService = OnboardingService.getInstance();

      const member = interaction.member;
      if (!member || !interaction.guild) {
        throw new Error("Membre ou guilde non trouvé");
      }

      // Vérifier si le membre existe déjà
      const existingUser = await onboardingService.getUserByDiscordId(interaction.user.id);
      
      if (existingUser) {
        await interaction.editReply({
          content: "Vous êtes déjà membre de la communauté! Nous allons vous rediriger vers votre tableau de bord."
        });
        
        setTimeout(async () => {
          await sendUserDashboard(
            interaction.user,
            interaction.client,
            interaction.guild?.id
          );
        }, 2000);
        
        return;
      }

      // Créer l'embed pour la confirmation
      const confirmEmbed = new EmbedBuilder()
        .setColor(0x00313C)
        .setTitle('🎉 Bienvenue dans la communauté Simplon!')
        .setDescription(`
          Vous venez de rejoindre notre espace d'échange et de collaboration.
          
          **Voici ce que vous pouvez faire maintenant:**
          
          • Explorer les ressources partagées par la communauté
          • Partager vos propres ressources et connaissances
          • Participer aux discussions et entraide
          • Gagner des points d'expérience et progresser en niveau
          
          Cliquez sur le bouton ci-dessous pour accéder à votre tableau de bord!
        `)
        .setFooter({ 
          text: 'Communauté Simplon',
          iconURL: 'https://evenement.simplon.co/hs-fs/hubfs/SIMPLON_LOGO_2024%20(1).png?width=1920&height=592&name=SIMPLON_LOGO_2024%20(1).png'
        });

      // Créer le bouton pour accéder au tableau de bord
      const dashboardButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('show_dashboard')
            .setLabel('Accéder à mon tableau de bord')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊')
        );

      // Inscrire le membre à la communauté
      try {
        logDebug(`Inscription du membre ${interaction.user.id} à la communauté`);
        
        // Utiliser le service d'onboarding pour gérer l'inscription complète
        if (interaction.member?.user) {
          const guildMember = await interaction.guild.members.fetch(interaction.user.id);
          const success = await onboardingService.registerNewMember(guildMember);
          
          if (!success) {
            throw new Error("Échec de l'enregistrement du membre");
          }
        }
        
        logDebug(`Membre ${interaction.user.id} inscrit avec succès`);
      } catch (error) {
        logError(`Erreur lors de l'inscription du membre ${interaction.user.id}`, error);
        await interaction.editReply({
          content: "Une erreur s'est produite lors de votre inscription. Veuillez réessayer plus tard."
        });
        return;
      }

      // Envoyer la confirmation
      await interaction.editReply({
        embeds: [confirmEmbed],
        components: [dashboardButton]
      });
      
    } catch (error) {
      logError("Erreur lors du traitement du bouton Join Community", error);
      await interaction.editReply({
        content: "Une erreur s'est produite. Veuillez réessayer plus tard."
      }).catch(console.error);
    }
  }
} 