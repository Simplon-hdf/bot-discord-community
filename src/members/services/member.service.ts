import { Guild, GuildMember } from 'discord.js';
import { MemberApiService } from '../../api/services/member.service';
import { MemberInformationApiService } from '../../api/services/member-information.service';
import { DiscordUserApiService } from '../../api/services/discord-user.service';
import { GuildApiService } from '../../api/services/guild.service';
import { DiscordUserCreateDto } from '../../api/types/discord-user.types';
import { MemberCreateDto, MemberDto, MemberStatus, CommunityRole, MemberQueryParams } from '../../api/types/member.types';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Service pour gérer les membres dans l'application Discord
 * Fait le lien entre les entités Discord et l'API backend
 */
export class MemberService {
  private static instance: MemberService;
  private memberApiService: MemberApiService;
  private memberInfoApiService: MemberInformationApiService;
  private discordUserApiService: DiscordUserApiService;
  private guildApiService: GuildApiService;
  private cachedMembers: Map<string, MemberDto> = new Map();

  private constructor() {
    this.memberApiService = MemberApiService.getInstance();
    this.memberInfoApiService = MemberInformationApiService.getInstance();
    this.discordUserApiService = DiscordUserApiService.getInstance();
    this.guildApiService = GuildApiService.getInstance();
  }

  /**
   * Obtient l'instance unique du service
   */
  public static getInstance(): MemberService {
    if (!MemberService.instance) {
      MemberService.instance = new MemberService();
    }
    return MemberService.instance;
  }

  /**
   * Génère une clé de cache pour un membre
   */
  private getCacheKey(discordId: string, guildId: string): string {
    return `${discordId}:${guildId}`;
  }

  /**
   * Synchronise un membre Discord avec l'API
   */
  public async syncMember(member: GuildMember): Promise<MemberDto> {
    try {
      const discordId = member.user.id;
      const guildId = member.guild.id;
      const username = member.user.username;

      logDebug('Sync Member', { discordId, guildId, username });

      // 1. S'assurer que l'utilisateur Discord existe en BDD
      const discriminator = member.user.discriminator;
      logDebug('Discord User Info', { 
        username, 
        discriminator, 
        normalizedDiscriminator: discriminator === '0' ? '0000' : discriminator 
      });

      const discordUserData: DiscordUserCreateDto = {
        uuidDiscord: discordId,
        discordUsername: username,
        discriminator: discriminator === '0' ? '0000' : discriminator
      };

      // Vérifier ou créer l'utilisateur Discord
      const discordUser = await this.discordUserApiService.getOrCreateDiscordUser(discordUserData);
      logDebug('Discord User Created or Found', { discordId: discordUser.uuidDiscord });

      // 2. S'assurer que la guild existe en BDD
      logDebug('Checking Guild', {
        guildId,
        guildName: member.guild.name,
        memberCount: member.guild.memberCount.toString()
      });

      try {
        // Vérifier ou créer la guild
        const guild = await this.guildApiService.getOrCreateGuild(
          guildId,
          member.guild.name,
          member.guild.memberCount.toString()
        );
        
        // 3. Vérifier si le membre existe déjà pour cette guild
        const existingMember = await this.memberApiService.getMemberByDiscordId(discordId, guild.uuid);
        
        if (existingMember) {
          // 4. Si le membre existe, vérifier s'il y a des mises à jour à faire
          // Pour l'instant, on retourne simplement le membre existant
          return existingMember;
        } else {
          // 5. Si le membre n'existe pas, le créer
          const newMemberData: MemberCreateDto = {
            uuidDiscord: discordId,
            uuidGuild: guild.uuid,
            guildUsername: username,
            xp: 0,
            level: 0,
            communityRole: "Memberofcommunity",
            status: MemberStatus.ACTIVE
          };
          
          const newMember = await this.memberApiService.createMember(newMemberData);
          this.cachedMembers.set(this.getCacheKey(discordId, guildId), newMember);
          return newMember;
        }
      } catch (error) {
        logError('Create/Get Guild Error', error);
        throw error;
      }
    } catch (error) {
      logError('Sync Member', error);
      throw error;
    }
  }

  /**
   * Récupère les données d'un membre (en utilisant le cache si disponible)
   */
  public async getMember(discordId: string, guildId: string): Promise<MemberDto | null> {
    // Essayer d'abord le cache
    const cacheKey = this.getCacheKey(discordId, guildId);
    const cachedMember = this.cachedMembers.get(cacheKey);
    
    if (cachedMember) {
      logDebug('Cache Hit', { discordId, guildId });
      return cachedMember;
    }
    
    try {
      // Récupérer depuis l'API
      const member = await this.memberApiService.getMemberByDiscordId(discordId, guildId);
      
      if (member) {
        // Mettre en cache
        this.cachedMembers.set(cacheKey, member);
      }
      
      return member;
    } catch (error) {
      logError('Get Member', error);
      return null;
    }
  }

  /**
   * Met à jour l'XP d'un membre
   */
  public async addXp(discordId: string, guildId: string, xpToAdd: number): Promise<MemberDto | null> {
    try {
      // Récupérer le membre
      const member = await this.getMember(discordId, guildId);
      if (!member) {
        logError('Add XP', `Membre non trouvé: ${discordId} dans ${guildId}`);
        return null;
      }
      
      // Calculer la nouvelle XP
      const currentXp = typeof member.xp === 'string' ? parseInt(member.xp, 10) : member.xp;
      const newXp = currentXp + xpToAdd;
      
      // Calculer le nouveau niveau
      const newLevel = this.calculateLevel(newXp);
      
      // Mettre à jour le membre dans l'API
      const updatedMember = await this.memberApiService.updateMember(member.uuidMember, {
        xp: newXp,
        level: newLevel
      });
      
      // Mettre à jour le cache
      const cacheKey = this.getCacheKey(discordId, guildId);
      this.cachedMembers.set(cacheKey, updatedMember);
      
      logDebug('Add XP', {
        memberId: discordId,
        oldXp: currentXp,
        xpAdded: xpToAdd,
        newXp,
        oldLevel: member.level,
        newLevel
      });
      
      return updatedMember;
    } catch (error) {
      logError('Add XP', error);
      return null;
    }
  }

  /**
   * Calcule le niveau en fonction de l'XP
   */
  private calculateLevel(xp: number): number {
    // Formule simple: chaque niveau nécessite level * 100 XP
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  /**
   * Met à jour le statut d'un membre
   */
  public async updateMemberStatus(discordId: string, guildId: string, status: string): Promise<MemberDto | null> {
    try {
      // Récupérer le membre
      const member = await this.getMember(discordId, guildId);
      if (!member) {
        logError('Update Status', `Membre non trouvé: ${discordId} dans ${guildId}`);
        return null;
      }
      
      // Mettre à jour le membre dans l'API
      const updatedMember = await this.memberApiService.updateMember(member.uuidMember, {
        status
      });
      
      // Mettre à jour le cache
      const cacheKey = this.getCacheKey(discordId, guildId);
      this.cachedMembers.set(cacheKey, updatedMember);
      
      logDebug('Update Status', {
        memberId: discordId,
        oldStatus: member.status,
        newStatus: status
      });
      
      return updatedMember;
    } catch (error) {
      logError('Update Status', error);
      return null;
    }
  }

  /**
   * Met à jour le rôle communautaire d'un membre
   */
  public async updateCommunityRole(discordId: string, guildId: string, role: string): Promise<MemberDto | null> {
    try {
      // Récupérer le membre
      const member = await this.getMember(discordId, guildId);
      if (!member) {
        logError('Update Role', `Membre non trouvé: ${discordId} dans ${guildId}`);
        return null;
      }
      
      // Mettre à jour le membre dans l'API
      const updatedMember = await this.memberApiService.updateMember(member.uuidMember, {
        communityRole: role
      });
      
      // Mettre à jour le cache
      const cacheKey = this.getCacheKey(discordId, guildId);
      this.cachedMembers.set(cacheKey, updatedMember);
      
      logDebug('Update Role', {
        memberId: discordId,
        oldRole: member.communityRole,
        newRole: role
      });
      
      return updatedMember;
    } catch (error) {
      logError('Update Role', error);
      return null;
    }
  }

  /**
   * Récupère le classement des membres par XP
   */
  public async getLeaderboard(guildId: string, limit: number = 10): Promise<MemberDto[]> {
    try {
      // Récupérer tous les membres du serveur
      const members = await this.memberApiService.getMembers({
        uuidGuild: guildId
      });
      
      // Trier par XP (décroissant)
      return members
        .sort((a, b) => b.xp - a.xp)
        .slice(0, limit);
    } catch (error) {
      logError('Get Leaderboard', error);
      return [];
    }
  }

  /**
   * Vérifie si un utilisateur est membre de la communauté
   */
  public async isCommunityMember(discordId: string, guildId: string): Promise<boolean> {
    try {
      // Récupérer le membre
      const member = await this.getMember(discordId, guildId);
      if (!member) {
        return false;
      }
      
      // Vérifier si le rôle est "Memberofcommunity"
      return member.communityRole === 'Memberofcommunity';
    } catch (error) {
      logError('Check Community Member', error);
      return false;
    }
  }

  /**
   * Récupère le premier guild ID disponible pour un utilisateur Discord
   * Utile pour les interactions en message privé
   */
  public async getFirstGuildIdForUser(discordId: string): Promise<string | null> {
    try {
      // Pour simplifier, on récupère tous les membres associés à cet utilisateur
      const memberApiService = this.memberApiService;
      const params: MemberQueryParams = { uuidDiscord: discordId };
      
      const members = await memberApiService.getMembers(params);
      
      // Si l'utilisateur a au moins un membre dans un serveur, on retourne le premier guild ID
      if (members.length > 0) {
        const guildId = members[0].uuidGuild;
        logDebug('First Guild ID', { discordId, guildId });
        return guildId;
      }
      
      logDebug('No Guild Found', { discordId });
      return null;
    } catch (error) {
      logError('Get First Guild ID', error);
      return null;
    }
  }
} 