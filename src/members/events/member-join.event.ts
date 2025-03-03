import { GuildMember } from 'discord.js';
import { MemberService } from '../services/member.service';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Gère l'événement lorsqu'un membre rejoint le serveur
 */
export async function handleMemberJoin(member: GuildMember): Promise<void> {
  try {
    logDebug('Member Join', `${member.user.tag} a rejoint ${member.guild.name}`);
    
    // Synchroniser le membre avec l'API
    const memberService = MemberService.getInstance();
    const apiMember = await memberService.syncMember(member);
    
    logDebug('Member Sync', {
      member: member.user.tag,
      apiMemberId: apiMember.uuidMember,
      xp: apiMember.xp,
      level: apiMember.level
    });
  } catch (error) {
    logError('Member Join Handler', error);
  }
} 