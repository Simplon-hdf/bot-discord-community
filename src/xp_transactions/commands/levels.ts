import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('niveaux')
    .setDescription('Affiche les informations sur les niveaux et badges disponibles');

export async function execute(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
        .setColor('#4CAF50')
        .setTitle('📊 Système de Niveaux et Badges')
        .setDescription('Voici comment fonctionne le système d\'XP et de badges !')
        .addFields(
            {
                name: '🎯 Gains d\'XP',
                value: [
                    '• Message : +3 XP',
                    '• Partager une ressource : +50 XP',
                    '• Recevoir un vote utile : +25 XP',
                    '• Signalement justifié : +40 XP'
                ].join('\n')
            },
            {
                name: '⚠️ Pertes d\'XP',
                value: [
                    '• Recevoir un vote inutile : -15 XP',
                    '• Signalement injustifié : -30 XP',
                    '• Ressource supprimée : -50 XP',
                    '• Tentative de triche : -100 XP',
                    '• Vote abusif : -25 XP'
                ].join('\n')
            },
            {
                name: '🏅 Badges disponibles',
                value: [
                    '• SimplonNovice (Niveau 1)',
                    '• SimplonInitié (Niveau 10)',
                    '• SimplonChampion (Niveau 20)',
                    '• SimplonLeader (Niveau 30)',
                    '• SimplonMaître (Niveau 40)',
                    '• Simplonoré (Niveau 50)'
                ].join('\n')
            },
            {
                name: '📈 Progression',
                value: 'Le système de niveaux est logarithmique, ce qui signifie que plus vous montez en niveau, plus il faudra d\'XP pour passer au niveau suivant !'
            }
        )
        .setFooter({ text: 'Continuez à contribuer pour gagner des badges ! 🌟' });

    await interaction.editReply({ embeds: [embed] });
} 