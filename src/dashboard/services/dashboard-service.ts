import { User } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { MemberApiService } from '../../api/services/member.service';
import { DiscordUserApiService } from '../../api/services/discord-user.service';
import { ApiService } from '../../api/services/api.service';
import { ResourceApiService } from '../../api/services/resource.service';
import { MemberQueryParams, MemberStatus } from '../../api/types/member.types';

/**
 * Type représentant un profil utilisateur pour le dashboard
 * Version simplifiée, sans XP ni système de votes
 */
export interface DashboardUserProfile {
  userId: string;
  username: string;
  joinedAt: Date;
  lastActive: Date;
}

/**
 * Service centralisant la logique de tableau de bord
 * Utilise directement les services API pour réduire les dépendances
 */
export class DashboardService {
  private static instance: DashboardService;
  private memberApiService: MemberApiService;
  private discordUserApiService: DiscordUserApiService;
  private resourceApiService: ResourceApiService;
  private apiService: ApiService;

  private constructor() {
    this.memberApiService = MemberApiService.getInstance();
    this.discordUserApiService = DiscordUserApiService.getInstance();
    this.resourceApiService = ResourceApiService.getInstance();
    this.apiService = ApiService.getInstance();
  }

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Récupère le profil d'un utilisateur pour affichage dans le tableau de bord
   */
  public async getUserProfile(user: User): Promise<DashboardUserProfile> {
    try {
      // Récupérer les données de l'utilisateur depuis l'API
      const discordUser = await this.discordUserApiService.getDiscordUserById(user.id);
      
      // Pour cet exemple, nous utilisons le premier membre actif trouvé
      // Dans un cas réel, il faudrait aussi passer le guildId
      const guildId = await this.getFirstGuildForUser(user.id);
      
      let memberInfo = null;
      if (guildId) {
        memberInfo = await this.memberApiService.getMemberByDiscordId(user.id, guildId);
      }
      
      // Si l'utilisateur n'existe pas encore, créer un profil par défaut
      if (!discordUser || !memberInfo) {
        logDebug('Dashboard Service', `Création d'un profil temporaire pour ${user.username}`);
        return this.createDefaultProfile(user);
      }
      
      // Construire le profil simplifié
      return {
        userId: user.id,
        username: user.username,
        joinedAt: new Date(memberInfo.createdAt),
        lastActive: new Date()
      };
    } catch (error) {
      logError('Dashboard Service', `Erreur lors de la récupération du profil: ${error}`);
      // En cas d'erreur, retourner un profil par défaut
      return this.createDefaultProfile(user);
    }
  }

  /**
   * Récupère le premier guild ID pour un utilisateur
   * Utile quand on ne connaît pas le guild ID spécifique
   */
  private async getFirstGuildForUser(discordId: string): Promise<string | null> {
    try {
      const params: MemberQueryParams = { 
        uuidDiscord: discordId,
        status: MemberStatus.ACTIVE
      };
      
      const members = await this.memberApiService.getMembers(params);
      return members.length > 0 ? members[0].uuidGuild : null;
    } catch (error) {
      logError('Get First Guild', error);
      return null;
    }
  }

  /**
   * Crée un profil par défaut pour un utilisateur
   */
  private createDefaultProfile(user: User): DashboardUserProfile {
    return {
      userId: user.id,
      username: user.username,
      joinedAt: new Date(),
      lastActive: new Date()
    };
  }

  /**
   * Récupère les membres de la communauté
   * Version simplifiée, sans tri par XP/niveau
   */
  public async getCommunityMembers(limit: number = 10): Promise<DashboardUserProfile[]> {
    try {
      // Récupérer les membres actifs
      const params: MemberQueryParams = {
        status: MemberStatus.ACTIVE,
        limit
      };
      
      const members = await this.memberApiService.getMembers(params);
      
      // Convertir en format DashboardUserProfile
      const profiles: DashboardUserProfile[] = [];
      
      for (const member of members) {
        // Récupérer l'utilisateur Discord associé
        const discordUser = await this.discordUserApiService.getDiscordUserById(member.uuidDiscord);
        
        if (discordUser) {
          profiles.push({
            userId: member.uuidDiscord,
            username: discordUser.discordUsername,
            joinedAt: new Date(member.createdAt),
            lastActive: new Date()
          });
        }
      }
      
      return profiles;
    } catch (error) {
      logError('Dashboard Service', `Erreur lors de la récupération des membres: ${error}`);
      return [];
    }
  }
} 