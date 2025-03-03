import { User } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';
import { UserProfile, XP_REWARDS } from '../types/user.types';

export class UserProfileService {
  private static instance: UserProfileService;
  private userProfiles: Map<string, UserProfile> = new Map();

  private constructor() {}

  public static getInstance(): UserProfileService {
    if (!UserProfileService.instance) {
      UserProfileService.instance = new UserProfileService();
    }
    return UserProfileService.instance;
  }

  public getProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }

  public createProfile(user: User): UserProfile {
    const newProfile: UserProfile = {
      userId: user.id,
      username: user.username,
      xp: 0,
      level: 1,
      badges: [],
      resourcesShared: 0,
      resourcesVoted: 0,
      joinedAt: new Date(),
      lastActive: new Date()
    };

    this.userProfiles.set(user.id, newProfile);
    logDebug('User Profile', `Profil créé pour ${user.username} (${user.id})`);
    return newProfile;
  }

  public getOrCreateProfile(user: User): UserProfile {
    const existingProfile = this.getProfile(user.id);
    if (existingProfile) {
      return existingProfile;
    }
    return this.createProfile(user);
  }

  public addXP(userId: string, amount: number): { newXP: number, newLevel: number, leveledUp: boolean } {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      logError('User Profile', `Impossible d'ajouter de l'XP: profil non trouvé pour ${userId}`);
      return { newXP: 0, newLevel: 1, leveledUp: false };
    }

    // Mettre à jour l'XP
    profile.xp += amount;
    profile.lastActive = new Date();
    
    // Calculer le nouveau niveau
    const oldLevel = profile.level;
    profile.level = this.calculateLevel(profile.xp);
    const leveledUp = profile.level > oldLevel;
    
    if (leveledUp) {
      logDebug('User Profile', `${profile.username} est passé au niveau ${profile.level}!`);
    }

    this.userProfiles.set(userId, profile);
    return { 
      newXP: profile.xp, 
      newLevel: profile.level, 
      leveledUp 
    };
  }

  public addBadge(userId: string, badge: string): boolean {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      logError('User Profile', `Impossible d'ajouter un badge: profil non trouvé pour ${userId}`);
      return false;
    }

    if (!profile.badges.includes(badge)) {
      profile.badges.push(badge);
      this.userProfiles.set(userId, profile);
      logDebug('User Profile', `Badge "${badge}" ajouté pour ${profile.username}`);
      return true;
    }
    
    return false;
  }

  public incrementResourcesShared(userId: string): number {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      logError('User Profile', `Impossible d'incrémenter les ressources: profil non trouvé pour ${userId}`);
      return 0;
    }

    profile.resourcesShared += 1;
    profile.lastActive = new Date();
    this.userProfiles.set(userId, profile);
    
    // Ajouter de l'XP pour le partage de ressource
    this.addXP(userId, XP_REWARDS.SHARE_RESOURCE);
    
    return profile.resourcesShared;
  }

  public incrementResourcesVoted(userId: string): number {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      logError('User Profile', `Impossible d'incrémenter les votes: profil non trouvé pour ${userId}`);
      return 0;
    }

    profile.resourcesVoted += 1;
    profile.lastActive = new Date();
    this.userProfiles.set(userId, profile);
    
    // Ajouter de l'XP pour avoir voté
    this.addXP(userId, XP_REWARDS.VOTE_RESOURCE);
    
    return profile.resourcesVoted;
  }

  private calculateLevel(xp: number): number {
    // Formule simple: chaque niveau nécessite xp = level * 100
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  public getXPForNextLevel(level: number): number {
    return level * level * 100;
  }

  public getUserRanking(limit: number = 10): UserProfile[] {
    // Convertir Map en tableau, trier par XP et prendre les premiers
    return Array.from(this.userProfiles.values())
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit);
  }
} 