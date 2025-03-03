import { GuildMember, User } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { MemberApiService } from '../../api/services/member.service';
import { DiscordUserApiService } from '../../api/services/discord-user.service';
import { ApiService } from '../../api/services/api.service';
import { MemberCreateDto, MemberStatus, MemberQueryParams } from '../../api/types/member.types';
import { DiscordUserCreateDto } from '../../api/types/discord-user.types';
import { TempStorageService } from '../../core/services/temp-storage.service';

/**
 * Service centralisant la logique d'onboarding des utilisateurs
 * Utilise directement les services API pour réduire les dépendances
 */
export class OnboardingService {
  private static instance: OnboardingService;
  private memberApiService: MemberApiService;
  private discordUserApiService: DiscordUserApiService;
  private apiService: ApiService;
  private tempStorageService: TempStorageService;

  private constructor() {
    this.memberApiService = MemberApiService.getInstance();
    this.discordUserApiService = DiscordUserApiService.getInstance();
    this.apiService = ApiService.getInstance();
    this.tempStorageService = TempStorageService.getInstance();
  }

  public static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
    }
    return OnboardingService.instance;
  }

  /**
   * Vérifie si un utilisateur est déjà membre de la communauté
   */
  public async isUserAlreadyMember(userId: string, guildId: string): Promise<boolean> {
    try {
      // Utiliser directement l'API pour vérifier le statut du membre
      const params: MemberQueryParams = { 
        uuidDiscord: userId,
        uuidGuild: guildId,
        status: MemberStatus.ACTIVE
      };
      
      const members = await this.memberApiService.getMembers(params);
      return members.length > 0;
    } catch (error) {
      logError('OnboardingService.isUserAlreadyMember', error);
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur existe déjà dans la base de données
   */
  public async getUserByDiscordId(discordId: string): Promise<any> {
    try {
      return await this.discordUserApiService.getDiscordUserById(discordId);
    } catch (error) {
      logError('OnboardingService.getUserByDiscordId', error);
      return null;
    }
  }

  /**
   * Stocke des données temporaires pour le processus d'onboarding
   */
  public async storeOnboardingData(userId: string, data: any): Promise<boolean> {
    try {
      // Utiliser le service de stockage temporaire interne au lieu de l'API
      const storageKey = `onboarding_${userId}`;
      await this.tempStorageService.storeData(storageKey, data, true);
      return true;
    } catch (error) {
      logError('OnboardingService.storeOnboardingData', error);
      return false;
    }
  }

  /**
   * Crée un nouvel utilisateur Discord dans le système
   */
  public async createUser(userData: { discordId: string, username: string, avatarUrl: string }): Promise<any> {
    try {
      // Convertir les données utilisateur au format attendu par l'API
      const userDto: DiscordUserCreateDto = {
        uuidDiscord: userData.discordId,
        discordUsername: userData.username,
        discriminator: '0000' // Toujours utiliser 0000 comme valeur par défaut pour les nouveaux utilisateurs Discord
      };
      
      return await this.discordUserApiService.createDiscordUser(userDto);
    } catch (error) {
      logError('OnboardingService.createUser', error);
      throw error;
    }
  }

  /**
   * Enregistre un membre dans une guilde
   */
  public async registerMember(guildId: string, userId: string): Promise<boolean> {
    try {
      const memberDto: MemberCreateDto = {
        uuidDiscord: userId,
        uuidGuild: guildId,
        guildUsername: '', // À remplir si disponible
        xp: 0,
        level: 1,
        communityRole: 'Member', // Utiliser l'enum CommunityRole si nécessaire
        status: MemberStatus.ACTIVE
      };
      
      await this.memberApiService.createMember(memberDto);
      return true;
    } catch (error) {
      logError('OnboardingService.registerMember', error);
      return false;
    }
  }

  /**
   * Enregistre un nouveau membre dans la communauté
   */
  public async registerNewMember(member: GuildMember): Promise<boolean> {
    try {
      // 1. Créer ou récupérer l'utilisateur Discord
      const user = await this.createUser({
        discordId: member.user.id,
        username: member.user.username,
        avatarUrl: member.user.displayAvatarURL()
      });
      
      if (!user) {
        throw new Error("Échec de création de l'utilisateur");
      }
      
      // 2. Enregistrer le membre dans la guilde
      const memberRegistered = await this.registerMember(member.guild.id, member.user.id);
      if (!memberRegistered) {
        throw new Error("Échec d'enregistrement du membre");
      }
      
      // 3. Stocker les données d'onboarding
      await this.storeOnboardingData(member.user.id, {
        step: 'joined_community',
        timestamp: new Date().toISOString()
      });
      
      logDebug('OnboardingService', `Membre ${member.user.id} inscrit avec succès`);
      return true;
    } catch (error) {
      logError('OnboardingService.registerNewMember', error);
      return false;
    }
  }

  /**
   * Synchronise un membre existant 
   */
  public async syncMember(member: GuildMember): Promise<boolean> {
    try {
      // 1. S'assurer que l'utilisateur Discord existe
      let user = await this.getUserByDiscordId(member.user.id);
      
      if (!user) {
        // Créer l'utilisateur s'il n'existe pas
        user = await this.createUser({
          discordId: member.user.id,
          username: member.user.username,
          avatarUrl: member.user.displayAvatarURL()
        });
      }
      
      // 2. Mettre à jour ou créer le membre
      const isMember = await this.isUserAlreadyMember(member.user.id, member.guild.id);
      
      if (!isMember) {
        await this.registerMember(member.guild.id, member.user.id);
      }
      
      logDebug('OnboardingService', `Membre ${member.user.id} synchronisé avec succès`);
      return true;
    } catch (error) {
      logError('OnboardingService.syncMember', error);
      return false;
    }
  }
} 