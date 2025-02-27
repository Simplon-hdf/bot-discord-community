import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Créer une nouvelle instance du client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Événement quand le bot est prêt
client.once('ready', () => {
  console.log('Bot is ready! 🚀');
  console.log(`Logged in as ${client.user?.tag}`);
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

// Se connecter à Discord avec le token
client.login(process.env.DISCORD_TOKEN)
  .catch((error) => {
    console.error('Erreur de connexion:', error);
    process.exit(1);
  }); 