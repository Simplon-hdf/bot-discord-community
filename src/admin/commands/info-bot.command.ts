import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { Command } from '../../core/commands/command.interface';

// Définition de la commande
const infoBotCommand = new SlashCommandBuilder()
  .setName('info-bot')
  .setDescription('Affiche des informations sur le bot')
  .toJSON();

// Implémentation de la commande
async function execute(interaction: ChatInputCommandInteraction) {
  try {
    logDebug('Info Bot', `Commande exécutée par ${interaction.user.tag}`);
    
    const client = interaction.client;
    
    // Calcul des statistiques
    const totalUsers = client.users.cache.size;
    const totalGuilds = client.guilds.cache.size;
    const uptime = Math.floor(client.uptime ? client.uptime / 1000 : 0);
    
    // Création de l'embed d'information
    const infoEmbed = new EmbedBuilder()
      .setColor(0x00313C)
      .setTitle('📊 Informations sur le Bot')
      .setDescription('Voici quelques informations sur le bot et son état actuel.')
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: '🤖 Général',
          value: `
**Nom**: ${client.user.username}
**ID**: ${client.user.id}
**Temps de fonctionnement**: ${formatUptime(uptime)}
**Version Discord.js**: v14
          `,
          inline: false
        },
        {
          name: '📈 Statistiques',
          value: `
**Serveurs**: ${totalGuilds}
**Utilisateurs**: ${totalUsers}
**Latence**: ${client.ws.ping}ms
          `,
          inline: true
        },
        {
          name: '👨‍💻 Développement',
          value: `
**Langage**: TypeScript
**Architecture**: Modulaire
**Dernière mise à jour**: ${new Date().toLocaleDateString()}
          `,
          inline: true
        }
      )
      .setFooter({
        text: 'Communauté Simplon',
        iconURL: 'https://evenement.simplon.co/hs-fs/hubfs/SIMPLON_LOGO_2024%20(1).png?width=1920&height=592&name=SIMPLON_LOGO_2024%20(1).png'
      })
      .setTimestamp();
      
    await interaction.reply({
      embeds: [infoEmbed]
    });
    
    logDebug('Info Bot', 'Informations envoyées avec succès');
  } catch (error) {
    logError('Info Bot', `Erreur: ${error}`);
    
    try {
      await interaction.reply({
        content: "❌ Une erreur est survenue lors de la récupération des informations.",
        ephemeral: true
      });
    } catch (replyError) {
      logError('Info Bot - Reply', `Erreur de réponse: ${replyError}`);
    }
  }
}

/**
 * Formate le temps de fonctionnement en jours, heures, minutes, secondes
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days} jour${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (secs > 0) parts.push(`${secs} seconde${secs > 1 ? 's' : ''}`);
  
  return parts.join(', ');
}

// Exporter la commande au format Command
export const infoBotCommandConfig: Command = {
  data: infoBotCommand,
  isGlobal: true, // Disponible partout
  execute
}; 