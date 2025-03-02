import { Client, GatewayIntentBits, Collection, ChatInputCommandInteraction, Partials } from 'discord.js';
import dotenv from 'dotenv';
import * as profile from './xp_transactions/commands/profile';
import * as leaderboard from './xp_transactions/commands/leaderboard';
import * as levels from './xp_transactions/commands/levels';
import { setupXPEvents } from './xp_transactions/events/xp-events';

// Interface pour étendre le type Client
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, any>;
  }
}

// Charger les variables d'environnement
dotenv.config();

// Créer une nouvelle instance du client Discord avec les intents nécessaires
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember
  ]
});

// Collection pour stocker les commandes
client.commands = new Collection();

// Enregistrer les commandes
client.commands.set(profile.data.name, profile);
client.commands.set(leaderboard.data.name, leaderboard);
client.commands.set(levels.data.name, levels);

// Événement quand le bot est prêt
client.once('ready', () => {
  console.log('Bot is ready! 🚀');
  console.log(`Logged in as ${client.user?.tag}`);
  
  // Configurer les événements XP
  setupXPEvents(client);
});

// Gestionnaire des commandes slash
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await interaction.deferReply();
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    try {
      const errorMessage = {
        content: 'Une erreur est survenue lors de l\'exécution de la commande.',
        ephemeral: true
      };
      
      if (interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else if (!interaction.replied) {
        await interaction.reply(errorMessage);
      }
    } catch (err) {
      console.error('Erreur lors de la gestion de l\'erreur:', err);
    }
  }
});

// Se connecter à Discord avec le token
client.login(process.env.DISCORD_TOKEN)
  .catch((error) => {
    console.error('Erreur de connexion:', error);
    process.exit(1);
  }); 