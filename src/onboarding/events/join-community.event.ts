import { ButtonInteraction, ButtonStyle, EmbedBuilder, ActionRowBuilder, ButtonBuilder } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { UserProfileService } from '../../user/services/user-profile.service';
import { sendUserDashboard } from '../../dashboard/events/dashboard.event';
import { MemberService } from '../../members/services/member.service';
import { TempStorageService } from '../../resources/services/temp-storage.service';

export async function handleJoinCommunityButton(interaction: ButtonInteraction) {
  if (interaction.customId === 'join_community') {
    try {
      logDebug('Join Community', `Bouton cliqué par ${interaction.user.tag}`);
      
      // Vérifier si l'utilisateur est déjà membre de la communauté
      const memberService = MemberService.getInstance();
      const guildId = interaction.guild?.id;
      
      if (!guildId) {
        await interaction.reply({
          content: 'Une erreur est survenue: impossible d\'identifier le serveur.',
          ephemeral: true
        });
        return;
      }
      
      // L'ID du serveur est déjà enregistré dans la base de données
      // lorsque l'utilisateur devient membre, nous n'avons plus besoin de le stocker temporairement
      
      const isMember = await memberService.isCommunityMember(interaction.user.id, guildId);
      
      if (isMember) {
        // Utilisateur déjà membre - informer qu'il est déjà inscrit
        try {
          // Message dans le serveur
          await interaction.reply({
            content: `✅ Vous êtes déjà membre de la communauté ! Pas besoin de vous inscrire à nouveau.`,
            ephemeral: true
          });
          
          // Envoi optionnel du tableau de bord uniquement si demandé
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('view_dashboard')
                .setLabel('Voir mon tableau de bord')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📊')
            );
          
          await interaction.followUp({
            content: "Souhaitez-vous consulter votre tableau de bord ?",
            components: [row],
            ephemeral: true
          });
        } catch (replyError) {
          logError('Join Community', `Erreur lors de la réponse: ${replyError}`);
        }
      } else {
        // Nouvel utilisateur - afficher le message de bienvenue standard
        const welcomeEmbed = new EmbedBuilder()
          .setTitle('🎉 Bienvenue dans l\'Aventure !')
          .setDescription(`
Salut ${interaction.user} ! Nous sommes ravis de t'accueillir dans notre communauté de passionnés. 
Prépare-toi à vivre une expérience unique d'apprentissage et de partage !
          `)
          .setColor(0x00313C)
          .setTimestamp()
          .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
          .addFields(
            {
              name: '🌟 Découvre la Communauté',
              value: `• Partage tes connaissances\n• Découvre des ressources enrichissantes\n• Participe aux discussions\n• Rejoins les événements communautaires`,
              inline: false
            },
            {
              name: '📈 Système de Progression',
              value: `• Gagne de l'XP en participant\n• Débloque des badges exclusifs\n• Monte en niveau\n• Deviens un membre reconnu`,
              inline: true
            },
            {
              name: '🏆 Comment Progresser',
              value: `• Partage des ressources\n• Aide les autres membres\n• Engage des discussions\n• Contribue activement`,
              inline: true
            }
          )
          .setFooter({
            text: '🚀 Rejoins-nous dans cette aventure passionnante !',
            iconURL: interaction.client.user.displayAvatarURL()
          });

        // Créer le bouton avec les classes appropriées
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('start_community')
              .setLabel('Commencer l\'aventure')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('✨')
          );

        // Mettre le bouton dans la réponse
        await interaction.reply({
          embeds: [welcomeEmbed],
          components: [row],
          ephemeral: true
        });

        logDebug('Join Community', 'Message de bienvenue envoyé à un nouvel utilisateur');
      }
    } catch (error) {
      logError('Join Community', error);
      await interaction.reply({
        content: 'Une erreur est survenue. Veuillez réessayer.',
        ephemeral: true
      });
    }
  }
} 