import { Client, GatewayIntentBits, Events } from 'discord.js';
import dotenv from 'dotenv';
import { handleResourceButtonInteraction } from './resources/events/resource-button-handler';
import { handleResourceModalSubmit } from './resources/events/resource-modal-handler';
import { handleTagSelectionMenu, handleColorSelectionMenu } from './resources/events/resource-selection-handler';
import { logDebug, logError } from './utils/error.utils';
import { WelcomeService } from './onboarding/services/welcome-service';
import { handleJoinCommunityButton } from './onboarding/events/join-community-handler';
import { handleStartCommunityButton } from './onboarding/events/start-community-handler';
import { sendUserDashboard, handleDashboardInteraction, handleViewDashboardButton } from './dashboard/events/dashboard-handler';

// Import du nouveau système de commandes
import { initializeCommandRegistry, registerCommandsWithDiscord } from './core/commands/command-registry';
import { handleCommandInteraction } from './core/commands/command-handler';

// Import des événements membre
import { handleMemberJoin } from './members/events/member-join.event';
import { handleMemberInteraction } from './members/events/member-interaction.event';
import { MemberService } from './members/services/member.service';
import { UserProfileService } from './user/services/user-profile.service';

// Import du système d'événements et des écouteurs de modules
import { EventBus } from './core/events/event-bus';
import { initializeResourceEventListeners } from './resources/events/event-listeners';

// Import du service d'initialisation des guildes
import { GuildInitializationService } from './core/services/guild-initialization.service';

// Import du service de gestion des canaux
import { ChannelService } from './core/services/channel-service';

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
    
    // Initialiser l'Event Bus et les écouteurs d'événements
    EventBus.getInstance(); // Initialiser l'instance de l'Event Bus
    initializeResourceEventListeners(); // Initialiser les écouteurs du module resources
    logDebug('Event System', 'Event Bus et écouteurs initialisés avec succès');

    // Initialiser les guildes dans la base de données
    const guildInitService = GuildInitializationService.getInstance();
    await guildInitService.initializeGuilds(client);
    logDebug('Guild Initialization', 'Tous les serveurs ont été initialisés dans la base de données');

    // Initialiser le service de canaux et le service de bienvenue
    const channelService = ChannelService.getInstance();
    const welcomeService = WelcomeService.getInstance();
    
    // Pour chaque serveur où le bot est présent
    for (const guild of client.guilds.cache.values()) {
      try {
        logDebug('Guild Initialization', `Initialisation du serveur: ${guild.name}`);
        
        // Initialiser les canaux depuis la base de données
        await channelService.initializeChannelsFromDatabase(guild.id);
        logDebug('Guild Initialization', `Canaux initialisés depuis la base de données pour ${guild.name}`);
        
        // Vérifier si les canaux existent déjà mais ne pas les créer automatiquement
        let welcomeChannel = channelService.getWelcomeChannel(client, guild.id);
        if (!welcomeChannel) {
          logDebug('Server Initialization', `Canal de bienvenue non configuré pour ${guild.name}. Pour le configurer, utilisez la commande /set-channel.`);
        }
        
        // Vérifier le canal des ressources
        let resourcesChannel = channelService.getResourcesChannel(client, guild.id);
        if (!resourcesChannel) {
          logDebug('Server Initialization', `Canal des ressources non configuré pour ${guild.name}. Pour le configurer, utilisez la commande /set-channel.`);
        }
        
        // Envoyer le message de bienvenue uniquement si le canal existe
        if (welcomeChannel) {
          // La méthode setWelcomeChannel est dépréciée mais conservée pour compatibilité
          welcomeService.setWelcomeChannel(welcomeChannel.id);
          // Message de bienvenue n'a besoin que du client comme paramètre
          await welcomeService.sendWelcomeMessage(client);
          logDebug('Welcome', `Message de bienvenue envoyé dans ${guild.name}`);
        } else {
          logError('Welcome', `Impossible de trouver ou créer un canal de bienvenue pour ${guild.name}`);
        }
      } catch (error) {
        logError(`Initialisation du serveur ${guild.name}`, error);
      }
    }
  } catch (error) {
    logError('Command Registration', error);
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
        await handleStartCommunityButton(interaction);
      } else if (interaction.customId === 'view_dashboard' || interaction.customId === 'show_dashboard') {
        // Utiliser la fonction spécifique du module dashboard
        await handleViewDashboardButton(interaction, client);
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
        const { default: tagCreateEventHandler } = await import('./tag/events/tag-create-event');
        await tagCreateEventHandler.execute(interaction);
      }
      else {
        await handleResourceModalSubmit(interaction);
      }
    } 
    // Gérer les menus de sélection
    else if (interaction.isStringSelectMenu()) {
      // Appeler les deux gestionnaires - chacun ne traite que son menu spécifique
      // en vérifiant le customId à l'intérieur
      await handleTagSelectionMenu(interaction);
      await handleColorSelectionMenu(interaction);
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