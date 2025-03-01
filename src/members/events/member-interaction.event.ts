import { Interaction } from 'discord.js';
import { MemberService } from '../services/member.service';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Gère l'événement lorsqu'un membre interagit avec le bot
 * Permet de s'assurer que le membre est synchronisé avec l'API
 */
export async function handleMemberInteraction(interaction: Interaction): Promise<void> {
  try {
    // Vérifier que l'interaction a lieu dans un serveur
    if (!interaction.guild || !interaction.member) {
      return;
    }
    
    // Récupérer les informations du membre
    const discordId = interaction.user.id;
    const guildId = interaction.guild.id;
    
    // Synchroniser le membre avec l'API
    const memberService = MemberService.getInstance();
    
    // On utilise GuildMember pour la synchronisation
    if (interaction.member.user) {
      const guildMember = await interaction.guild.members.fetch(discordId);
      await memberService.syncMember(guildMember);
      
      logDebug('Member Interaction Sync', {
        member: interaction.user.tag,
        guild: interaction.guild.name
      });
    }
  } catch (error) {
    logError('Member Interaction Handler', error);
  }
} 