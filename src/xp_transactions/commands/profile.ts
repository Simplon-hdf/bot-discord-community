import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { XPService } from '../services/xp-service';

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Affiche votre profil ou celui d\'un autre membre')
    .addUserOption(option =>
        option
            .setName('utilisateur')
            .setDescription('L\'utilisateur dont vous voulez voir le profil')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
    const xpService = XPService.getInstance();
    const profile = xpService.getUserProfile(targetUser.id);
    const nextLevelXP = xpService.getXPForNextLevel(profile.level);

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Profil de ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
            { name: 'Niveau', value: profile.level.toString(), inline: true },
            { name: 'XP', value: `${profile.xp}/${nextLevelXP}`, inline: true },
            { name: 'Badges', value: profile.badges.length > 0 ? profile.badges.join(', ') : 'Aucun badge' }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
} 