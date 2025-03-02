import { Client, Message, MessageReaction, PartialMessageReaction, User, PartialUser, TextChannel } from 'discord.js';
import { XPService } from '../services/xp-service';

const XP_VALUES = {
    MESSAGE: 3,
    SHARE_RESOURCE: 50,
    USEFUL_VOTE: 25,
    JUSTIFIED_REPORT: 40,
    USELESS_VOTE: -15,
    UNJUSTIFIED_REPORT: -30,
    REMOVED_RESOURCE: -50,
    CHEATING_ATTEMPT: -100,
    ABUSIVE_VOTE: -25
};

export function setupXPEvents(client: Client) {
    console.log('Configuration des événements XP...');
    const xpService = XPService.getInstance();

    // Gestion des messages et des ressources partagées
    client.on('messageCreate', async (message: Message) => {
        try {
            if (message.author.bot) return;
            
            // Vérifier si le message contient une ressource (liens ou fichiers)
            const hasLink = message.content.match(/https?:\/\/[^\s]+/);
            const hasAttachment = message.attachments.size > 0;
            
            if (hasLink || hasAttachment) {
                console.log(`Message avec ressource détecté de ${message.author.username}`);
                const updatedProfile = xpService.addXP(message.author.id, XP_VALUES.SHARE_RESOURCE, message.author.username);
                await message.reply({
                    content: `🎉 Merci pour le partage ! +${XP_VALUES.SHARE_RESOURCE} XP (Total: ${updatedProfile.xp} XP)`
                });
            } else if (message.content.length >= 5) { // Message normal d'au moins 5 caractères
                console.log(`Message normal de ${message.author.username}`);
                const updatedProfile = xpService.addXP(message.author.id, XP_VALUES.MESSAGE, message.author.username);
                // On n'envoie pas de notification pour éviter le spam
            }
        } catch (error) {
            console.error('Erreur lors du traitement du message:', error);
        }
    });

    // Gestion des votes sur les ressources
    client.on('messageReactionAdd', async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
        try {
            if (user.bot) return;
            
            // S'assurer que la réaction est chargée complètement
            const fullReaction = reaction.partial ? await reaction.fetch() : reaction;
            const message = await fullReaction.message.fetch();
            if (!message.author) return;

            console.log(`Réaction ${fullReaction.emoji.name} ajoutée par ${user.username}`);

            if (fullReaction.emoji.name === '👍') {
                const updatedProfile = xpService.addXP(message.author.id, XP_VALUES.USEFUL_VOTE, message.author.username);
                if (message.channel.isTextBased()) {
                    await message.channel.send({
                        content: `✨ ${message.author.username} a reçu ${XP_VALUES.USEFUL_VOTE} XP pour une ressource utile !`
                    });
                }
            } else if (fullReaction.emoji.name === '👎') {
                const updatedProfile = xpService.addXP(message.author.id, XP_VALUES.USELESS_VOTE, message.author.username);
                if (message.channel.isTextBased()) {
                    await message.channel.send({
                        content: `📉 ${message.author.username} a perdu ${Math.abs(XP_VALUES.USELESS_VOTE)} XP suite à un vote négatif.`
                    });
                }
            }
        } catch (error) {
            console.error('Erreur lors du traitement de la réaction:', error);
        }
    });

    // Gestion des signalements
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        console.log(`Interaction bouton ${interaction.customId} reçue`);

        if (interaction.customId === 'report_justified') {
            const updatedProfile = xpService.addXP(interaction.user.id, XP_VALUES.JUSTIFIED_REPORT);
            await interaction.reply({
                content: `✅ Signalement justifié : +${XP_VALUES.JUSTIFIED_REPORT} XP`,
                ephemeral: true
            });
        } else if (interaction.customId === 'report_unjustified') {
            const updatedProfile = xpService.addXP(interaction.user.id, XP_VALUES.UNJUSTIFIED_REPORT);
            await interaction.reply({
                content: `⚠️ Signalement injustifié : ${XP_VALUES.UNJUSTIFIED_REPORT} XP`,
                ephemeral: true
            });
        }
    });

    // Gestion des ressources supprimées
    client.on('messageDelete', async (message) => {
        if (!message.author) return;
        if (message.author.bot) return;

        // Vérifier si la suppression est faite par un modérateur
        const fetchedLogs = await message.guild?.fetchAuditLogs({
            limit: 1,
            type: 72 // MessageDelete
        });

        const deletionLog = fetchedLogs?.entries.first();
        if (deletionLog && deletionLog.executor?.id !== message.author.id) {
            const updatedProfile = xpService.addXP(message.author.id, XP_VALUES.REMOVED_RESOURCE);
            if (message.channel.isTextBased()) {
                await message.channel.send({
                    content: `⛔ Une ressource de ${message.author.username} a été supprimée : ${XP_VALUES.REMOVED_RESOURCE} XP`
                });
            }
        }
    });

    console.log('Configuration des événements XP terminée !');
}

// Fonctions utilitaires pour la gestion des comportements abusifs
export async function handleCheatingAttempt(userId: string, xpService: XPService) {
    console.log(`Tentative de triche détectée pour l'utilisateur ${userId}`);
    const updatedProfile = xpService.addXP(userId, XP_VALUES.CHEATING_ATTEMPT);
    // Notifier les modérateurs
}

export async function handleAbusiveVote(userId: string, xpService: XPService) {
    console.log(`Vote abusif détecté pour l'utilisateur ${userId}`);
    const updatedProfile = xpService.addXP(userId, XP_VALUES.ABUSIVE_VOTE);
    // Notifier les modérateurs
} 