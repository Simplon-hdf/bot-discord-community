import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { XPService } from '../services/xp-service';

export const data = new SlashCommandBuilder()
    .setName('classement')
    .setDescription('Affiche le classement des membres les plus actifs');

export async function execute(interaction: CommandInteraction) {
    const xpService = XPService.getInstance();
    const leaderboard = xpService.getLeaderboard();

    const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 Classement des membres')
        .setDescription('Les 10 membres les plus actifs de la communauté')
        .setTimestamp();

    const leaderboardPromises = leaderboard.map(async (entry, index) => {
        const user = await interaction.client.users.fetch(entry.userId);
        return `${index + 1}. ${user.username} - Niveau ${entry.level} (${entry.xp} XP)`;
    });

    const leaderboardEntries = await Promise.all(leaderboardPromises);
    
    if (leaderboardEntries.length > 0) {
        embed.addFields({ 
            name: 'Top 10', 
            value: leaderboardEntries.join('\n') 
        });
    } else {
        embed.addFields({ 
            name: 'Aucun classement', 
            value: 'Personne n\'a encore gagné d\'XP !' 
        });
    }

    await interaction.editReply({ embeds: [embed] });
} 