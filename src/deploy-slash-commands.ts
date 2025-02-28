import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Charger les variables d'environnement
config();

const commands: any[] = [];
const modules = ['tag', 'votes', 'reports', 'comments', 'xp_transactions', 'moderation_actions'];

// Parcourir tous les modules
modules.forEach(moduleName => {
  const commandsPath = path.join(__dirname, moduleName, 'commands');
  if (!fs.existsSync(commandsPath)) return;

  // Parcourir tous les fichiers de commandes du module
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const module = require(filePath);
    
    if ('data' in module && 'execute' in module) {
      commands.push(module.data.toJSON());
    } else if ('command' in module && 'data' in module.command && 'execute' in module.command) {
      commands.push(module.command.data.toJSON());
    }
  }
});

// Créer une instance REST pour interagir avec l'API Discord
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN || '');

// Fonction pour déployer les commandes
(async () => {
  try {
    console.log(`Déploiement de ${commands.length} commandes slash...`);

    // Récupérer l'ID du client (bot)
    const clientId = process.env.CLIENT_ID;
    const apiUrl = process.env.API_URL;
    
    if (!clientId) {
      console.error('CLIENT_ID manquant dans les variables d\'environnement');
      process.exit(1);
    }
    
    if (!apiUrl) {
      console.error('API_URL manquant dans les variables d\'environnement');
      process.exit(1);
    }

    // Déployer les commandes globalement
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log('Commandes slash déployées avec succès !');
  } catch (error) {
    console.error('Erreur lors du déploiement des commandes :', error);
  }
})(); 