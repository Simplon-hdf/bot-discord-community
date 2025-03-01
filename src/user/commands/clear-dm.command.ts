import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { Command } from '../../core/commands/command.interface';

// Définition de la commande
const clearDMCommand = new SlashCommandBuilder()
  .setName('clear-dm')
  .setDescription('Nettoie tous les messages du bot dans vos messages privés')
  .toJSON();

// Implémentation de la commande
async function execute(interaction: ChatInputCommandInteraction) {
  try {
    logDebug('Clear DM', `Commande exécutée par ${interaction.user.tag} (ID: ${interaction.user.id})`);
    logDebug('Clear DM', `Dans un ${interaction.inGuild() ? 'serveur' : 'message privé'}`);
    
    // Envoyer un message de confirmation initial (éphémère, visible seulement sur le serveur)
    await interaction.reply({
      content: '🔄 Lancement du nettoyage de vos messages privés. Veuillez patienter...',
      ephemeral: true
    });
    
    try {
      // Récupérer le canal de messages privés
      logDebug('Clear DM', 'Tentative de création du canal DM...');
      const dmChannel = await interaction.user.createDM();
      logDebug('Clear DM', `Canal DM créé avec succès (ID: ${dmChannel.id})`);
      
      // Message temporaire pour confirmer l'accès aux DMs
      logDebug('Clear DM', 'Envoi du message temporaire...');
      const tempMessage = await dmChannel.send("🧹 Nettoyage des messages en cours...");
      logDebug('Clear DM', `Message temporaire envoyé (ID: ${tempMessage.id})`);
      
      logDebug('Clear DM', `Début du nettoyage pour ${interaction.user.tag}`);
      
      // Fonction récursive pour supprimer les messages du bot
      async function deleteMessages(before: string | null = null, deleted = 0): Promise<number> {
        // Limite de sécurité pour éviter une boucle infinie
        if (deleted > 200) {
          logDebug('Clear DM', `Limite de suppression atteinte (${deleted} messages)`);
          return deleted;
        }
        
        // Paramètres de récupération
        const fetchOptions: { limit: number, before?: string } = { limit: 100 };
        if (before) fetchOptions.before = before;
        
        try {
          // Récupérer un lot de messages
          logDebug('Clear DM', `Récupération des messages (before: ${before || 'null'})...`);
          const messages = await dmChannel.messages.fetch(fetchOptions);
          
          if (!messages || messages.size === 0) {
            logDebug('Clear DM', 'Aucun message trouvé dans ce lot');
            return deleted;
          }
          
          logDebug('Clear DM', `${messages.size} messages récupérés`);
          
          // Filtrer pour ne garder que les messages du bot
          const botMessages = messages.filter(msg => {
            // C'est un message du bot
            if (msg.author.id !== interaction.client.user?.id || msg.id === tempMessage.id) {
              return false;
            }
            
            // Vérifier si c'est un dashboard
            const isDashboard = msg.embeds?.some(embed => 
              embed.title?.includes('Tableau de Bord Personnel') || 
              embed.description?.includes('résumé de ton activité')
            );
            
            // Garder tous les messages qui ne sont pas des dashboards
            return !isDashboard;
          });
          
          // Trouver tous les messages de dashboard
          const dashboardMessages = messages.filter(msg => 
            msg.author.id === interaction.client.user?.id &&
            msg.id !== tempMessage.id &&
            msg.embeds?.some(embed => 
              embed.title?.includes('Tableau de Bord Personnel') || 
              embed.description?.includes('résumé de ton activité')
            )
          );
          
          logDebug('Clear DM', `${botMessages.size} messages du bot trouvés dans ce lot`);
          logDebug('Clear DM', `${dashboardMessages.size} messages de dashboard trouvés dans ce lot`);
          
          // Si nous avons plus d'un dashboard, ne garder que le plus récent
          if (dashboardMessages.size > 0) {
            // Trier les dashboards par date (plus récent d'abord)
            const sortedDashboards = Array.from(dashboardMessages.values())
              .sort((a, b) => b.createdTimestamp - a.createdTimestamp);
            
            // Garder le plus récent, ajouter les autres à supprimer
            for (let i = 1; i < sortedDashboards.length; i++) {
              botMessages.set(sortedDashboards[i].id, sortedDashboards[i]);
            }
            
            logDebug('Clear DM', `${sortedDashboards.length > 1 ? sortedDashboards.length - 1 : 0} anciens dashboards ajoutés à la liste de suppression`);
          }
          
          if (botMessages.size === 0) {
            // Pas de messages du bot dans ce lot, mais continuer avec les messages plus anciens
            const oldestMessage = messages.last();
            if (oldestMessage) {
              logDebug('Clear DM', `Continuer avec le message ${oldestMessage.id}`);
              return deleteMessages(oldestMessage.id, deleted);
            }
            return deleted;
          }
          
          // Compteur pour ce lot
          let deletedInBatch = 0;
          
          // Supprimer chaque message du bot
          for (const [id, message] of botMessages) {
            try {
              logDebug('Clear DM', `Suppression du message ${id}...`);
              await message.delete();
              deletedInBatch++;
              
              // Petite pause pour éviter les limites de l'API
              await new Promise(resolve => setTimeout(resolve, 300));
            } catch (err) {
              logError('Clear DM', `Impossible de supprimer le message ${id}: ${err}`);
            }
          }
          
          logDebug('Clear DM', `${deletedInBatch} messages supprimés dans ce lot`);
          
          // Continuer avec le message le plus ancien
          const oldestMessage = messages.last();
          if (oldestMessage) {
            // Petite pause entre les lots
            await new Promise(resolve => setTimeout(resolve, 1000));
            logDebug('Clear DM', `Continuer avec le prochain lot (message: ${oldestMessage.id})`);
            return deleteMessages(oldestMessage.id, deleted + deletedInBatch);
          }
          
          return deleted + deletedInBatch;
        } catch (error) {
          logError('Clear DM', `Erreur lors de la suppression: ${error}`);
          return deleted;
        }
      }
      
      // Lancer le processus de suppression
      logDebug('Clear DM', 'Démarrage du processus de suppression...');
      const deletedCount = await deleteMessages();
      logDebug('Clear DM', `Processus de suppression terminé. ${deletedCount} messages supprimés au total.`);
      
      // Message final dans les DMs
      if (deletedCount > 0) {
        await tempMessage.edit(`✅ Nettoyage terminé: ${deletedCount} messages ont été supprimés.\nSeul le tableau de bord le plus récent a été conservé.`);
        // Supprimer le message après 10 secondes
        setTimeout(() => {
          tempMessage.delete().catch(err => logError('Clear DM', `Erreur lors de la suppression du message de confirmation: ${err}`));
        }, 10000);
      } else {
        await tempMessage.edit("✅ Aucun message à nettoyer trouvé.");
        // Supprimer le message après 10 secondes
        setTimeout(() => {
          tempMessage.delete().catch(err => logError('Clear DM', `Erreur lors de la suppression du message de confirmation: ${err}`));
        }, 10000);
      }
      
      // Mettre à jour le message sur le serveur
      await interaction.editReply({
        content: `✅ Le nettoyage de vos messages privés est terminé (${deletedCount} messages supprimés). Seul le tableau de bord le plus récent a été conservé.`
      });
      
    } catch (dmError) {
      logError('Clear DM', `Erreur d'accès aux messages privés: ${dmError}`);
      await interaction.editReply({
        content: "❌ Impossible d'accéder à vos messages privés. Vérifiez vos paramètres de confidentialité."
      });
    }
    
  } catch (error) {
    logError('Clear DM', `Erreur générale: ${error}`);
    try {
      await interaction.editReply({
        content: "❌ Une erreur est survenue lors du nettoyage des messages."
      });
    } catch (replyError) {
      logError('Clear DM', `Erreur lors de la réponse: ${replyError}`);
      
      try {
        await interaction.reply({
          content: "❌ Une erreur est survenue lors du nettoyage des messages.",
          ephemeral: true
        });
      } catch (finalError) {
        logError('Clear DM', `Impossible de répondre à l'utilisateur: ${finalError}`);
      }
    }
  }
}

// Exporter la commande au format Command
export const clearDMCommandConfig: Command = {
  data: clearDMCommand,
  isGlobal: true, // Commande disponible en DM
  execute
}; 