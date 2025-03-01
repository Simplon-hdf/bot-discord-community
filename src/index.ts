import { Client, GatewayIntentBits, Events } from 'discord.js';
import dotenv from 'dotenv';
import { SetupService } from './admin/services/setup.service';
import { handleResourceButtonInteraction } from './resources/events/button-interactions';
import { handleResourceModalSubmit } from './resources/events/modal-interactions';
import { handleResourceSelectMenuInteraction } from './resources/events/select-menu-interactions';
import { logDebug, logError } from './utils/error.utils';
import { WelcomeService } from './onboarding/services/welcome.service';
import { handleJoinCommunityButton } from './onboarding/events/join-community.event';
import { sendUserDashboard, handleDashboardInteraction } from './dashboard/events/dashboard.event';

// Import du nouveau système de commandes
import { initializeCommandRegistry, registerCommandsWithDiscord } from './core/commands/command-registry';
import { handleCommandInteraction } from './core/commands/command-handler';

// Import des événements membre
import { handleMemberJoin } from './members/events/member-join.event';
import { handleMemberInteraction } from './members/events/member-interaction.event';
import { MemberService } from './members/services/member.service';
import { UserProfileService } from './user/services/user-profile.service';

// Charger les variables d'environnement
dotenv.config();

// Initialiser le registre de commandes
initializeCommandRegistry();

// Créer une nouvelle instance du client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers, // Nécessaire pour les événements de membre
  ],
});

// Événement quand le bot est prêt
client.once('ready', async () => {
  logDebug('Bot Status', 'Bot is ready! 🚀');
  logDebug('Bot Login', `Logged in as ${client.user?.tag}`);

  try {
    // Enregistrer les commandes avec le nouveau système
    await registerCommandsWithDiscord(client);
  } catch (error) {
    logError('Command Registration', error);
  }

  // Pour chaque serveur où le bot est présent
  for (const guild of client.guilds.cache.values()) {
    try {
      // Configuration initiale
      const setupService = SetupService.getInstance();
      await setupService.checkAndSetupBot(client, guild);
      logDebug('Server Setup', `Configuration terminée pour le serveur: ${guild.name}`);

      // Configurer et envoyer le message d'accueil
      const welcomeService = WelcomeService.getInstance();
      const welcomeChannel = setupService.getWelcomeChannel(client);
      if (welcomeChannel) {
        welcomeService.setWelcomeChannel(welcomeChannel.id);
        await welcomeService.sendWelcomeMessage(client);
      }
    } catch (error) {
      logError(`Configuration du serveur ${guild.name}`, error);
    }
  }
});

// Événement quand un membre rejoint un serveur
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    await handleMemberJoin(member);
  } catch (error) {
    logError('Member Join', error);
  }
});

// Événement quand un message est reçu
client.on('messageCreate', async (message) => {
  // Ignorer les messages des bots
  if (message.author.bot) return;

  // Exemple de commande simple
  if (message.content === '!ping') {
    await message.reply('Pong! 🏓');
  }
});

// Gérer les interactions
client.on('interactionCreate', async (interaction) => {
  try {
    // Synchroniser le membre avec l'API UNIQUEMENT pour les interactions autres que les boutons d'onboarding
    // pour éviter la double synchronisation
    if (!(interaction.isButton() && 
        (interaction.customId === 'join_community' || interaction.customId === 'start_community'))) {
      await handleMemberInteraction(interaction);
    }
    
    // Gérer les commandes avec le nouveau système centralisé
    if (interaction.isChatInputCommand()) {
      await handleCommandInteraction(interaction);
      return;
    }

    // Gérer les interactions de boutons
    if (interaction.isButton()) {
      if (interaction.customId === 'join_community') {
        await handleJoinCommunityButton(interaction);
      } else if (interaction.customId === 'start_community') {
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
          
          // Vérifier d'abord si l'utilisateur est déjà membre de la communauté
          const memberService = MemberService.getInstance();
          const isMember = await memberService.isCommunityMember(interaction.user.id, guild.id);
          
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
            // Cette fonction va:
            // 1. Créer l'utilisateur Discord
            // 2. Créer le membre
            await memberService.syncMember(member);
            
            logDebug('Member Sync', `Membre synchronisé avec succès: ${interaction.user.tag}`);
            
            // Envoyer le tableau de bord
            const dashboardSent = await sendUserDashboard(
              interaction.user, 
              client,
              interaction.guild?.id // Passer l'ID du serveur s'il est disponible
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
            // Déjà répondu
          }
        }
      } else if (interaction.customId === 'view_dashboard') {
        try {
          logDebug('View Dashboard', `Bouton cliqué par ${interaction.user.tag}`);
          
          // L'ID du serveur est déjà enregistré dans la base de données
          // Nous n'avons plus besoin de le stocker temporairement
          
          await interaction.reply({
            content: '⏳ Récupération de votre tableau de bord...',
            ephemeral: true
          });
          
          // Envoyer le tableau de bord
          const dashboardSent = await sendUserDashboard(
            interaction.user, 
            client,
            interaction.guild?.id // Passer l'ID du serveur s'il est disponible
          );
          
          if (dashboardSent) {
            await interaction.editReply({
              content: '✅ Votre tableau de bord a été envoyé en message privé.',
            });
          } else {
            await interaction.editReply({
              content: "❌ Impossible de vous envoyer un message privé. Vérifiez vos paramètres de confidentialité."
            });
          }
        } catch (error) {
          logError('View Dashboard', error);
          await interaction.reply({
            content: 'Une erreur est survenue lors de la récupération de votre tableau de bord.',
            ephemeral: true
          });
        }
      } 
      // Gérer les boutons du dashboard en MP
      else if (['refresh_dashboard', 'view_leaderboard', 'create_resource_dashboard'].includes(interaction.customId)) {
        await handleDashboardInteraction(interaction);
      }
      else {
        await handleResourceButtonInteraction(interaction);
      }
    } 
    // Gérer les soumissions de modal
    else if (interaction.isModalSubmit()) {
      if (interaction.customId === 'community_welcome_modal') {
        // Pour l'instant, on ne fait rien de spécial après la fermeture de la modale de bienvenue
        await interaction.deferUpdate();
      } 
      else if (interaction.customId === 'tag_creation_modal') {
        // Importer dynamiquement le gestionnaire de tag pour éviter les références circulaires
        const { default: tagCreateEventHandler } = await import('./tag/events/tagCreate.event');
        await tagCreateEventHandler.execute(interaction);
      }
      else {
        await handleResourceModalSubmit(interaction);
      }
    } 
    // Gérer les menus de sélection
    else if (interaction.isStringSelectMenu()) {
      await handleResourceSelectMenuInteraction(interaction);
    }
  } catch (error) {
    logError('Interaction Handler', error);
  }
});

// Se connecter à Discord avec le token
client.login(process.env.DISCORD_TOKEN)
  .catch((error) => {
    logError('Connexion', error);
    process.exit(1);
  }); 