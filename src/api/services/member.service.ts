import { ApiService } from './api.service';
import { MemberCreateDto, MemberDto, MemberQueryParams, MemberStatus } from '../types/member.types';
import { ApiResponse } from '../types/base.types';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Service pour interagir avec l'API des membres
 */
export class MemberApiService {
  private static instance: MemberApiService;
  private apiService: ApiService;
  private readonly endpoint = 'members';

  private constructor() {
    this.apiService = ApiService.getInstance();
  }

  /**
   * Obtient l'instance unique du service (Singleton)
   */
  public static getInstance(): MemberApiService {
    if (!MemberApiService.instance) {
      MemberApiService.instance = new MemberApiService();
    }
    return MemberApiService.instance;
  }

  /**
   * Récupère tous les membres avec filtres optionnels
   */
  public async getMembers(params?: MemberQueryParams): Promise<MemberDto[]> {
    try {
      const queryParams = params ? 
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>) : {};
      
      const response = await this.apiService.get<MemberDto[]>(this.endpoint, { params: queryParams });
      return response.data;
    } catch (error) {
      logError('Get Members', error);
      return [];
    }
  }

  /**
   * Récupère un membre par son UUID
   */
  public async getMemberById(uuidMember: string): Promise<MemberDto | null> {
    try {
      const response = await this.apiService.get<MemberDto>(`${this.endpoint}/${uuidMember}`);
      return response.data;
    } catch (error) {
      if ((error as Error).message.includes('404')) {
        return null;
      }
      logError('Get Member By ID', error);
      throw error;
    }
  }

  /**
   * Récupère un membre par son UUID Discord
   */
  public async getMemberByDiscordId(uuidDiscord: string, uuidGuild: string): Promise<MemberDto | null> {
    try {
      const params: MemberQueryParams = {
        uuidDiscord,
        uuidGuild
      };
      
      const members = await this.getMembers(params);
      return members.length > 0 ? members[0] : null;
    } catch (error) {
      logError('Get Member By Discord ID', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau membre
   */
  public async createMember(memberData: MemberCreateDto): Promise<MemberDto> {
    try {
      logDebug('Create Member', { data: memberData });
      const response = await this.apiService.post<MemberDto>(this.endpoint, memberData);
      return response.data;
    } catch (error) {
      logError('Create Member', error);
      throw error;
    }
  }

  /**
   * Met à jour un membre existant
   */
  public async updateMember(uuidMember: string, memberData: Partial<MemberCreateDto>): Promise<MemberDto> {
    try {
      logDebug('Update Member', { uuidMember, data: memberData });
      const response = await this.apiService.put<MemberDto>(`${this.endpoint}/${uuidMember}`, memberData);
      return response.data;
    } catch (error) {
      logError('Update Member', error);
      throw error;
    }
  }

  /**
   * Supprime un membre
   */
  public async deleteMember(uuidMember: string): Promise<boolean> {
    try {
      logDebug('Delete Member', { uuidMember });
      await this.apiService.delete(`${this.endpoint}/${uuidMember}`);
      return true;
    } catch (error) {
      logError('Delete Member', error);
      throw error;
    }
  }

  /**
   * Obtient un membre par son ID Discord et ID de guilde, ou en crée un nouveau si nécessaire
   */
  public async getOrCreateMember(
    uuidDiscord: string, 
    uuidGuild: string, 
    guildUsername: string
  ): Promise<MemberDto> {
    try {
      // Essayer de récupérer le membre existant
      const existingMember = await this.getMemberByDiscordId(uuidDiscord, uuidGuild);
      if (existingMember) {
        logDebug('Member Found', { 
          memberId: existingMember.uuidMember,
          discordId: uuidDiscord, 
          guildId: uuidGuild 
        });
        return existingMember;
      }

      // Membre non trouvé, on va en créer un nouveau
      logDebug('Creating New Member', { 
        uuidDiscord, 
        uuidGuild, 
        guildUsername 
      });

      // Préparer les données du nouveau membre
      const newMemberData: MemberCreateDto = {
        uuidDiscord,
        uuidGuild,
        guildUsername,
        xp: 0,
        level: 1,
        communityRole: 'Memberofcommunity',
        status: 'Active'
      };

      // Créer le nouveau membre
      logDebug('Create Member', { data: newMemberData });
      const newMember = await this.createMember(newMemberData);

      return newMember;
    } catch (error) {
      logError('Get Or Create Member', error);
      throw error;
    }
  }
} 