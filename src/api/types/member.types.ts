/**
 * Types pour l'API des membres
 */

// Type pour la création et mise à jour d'un membre
export interface MemberCreateDto {
  uuidDiscord: string;
  uuidGuild: string;
  guildUsername: string;
  xp: number;
  level: number;
  communityRole: string;
  status: string;
}

// Type étendu pour représenter un membre depuis l'API
export interface MemberDto extends MemberCreateDto {
  uuidMember: string;
  createdAt: string;
  updatedAt: string;
}

// Type pour les paramètres de recherche de membres
export interface MemberQueryParams {
  uuidDiscord?: string;
  uuidGuild?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// Statut possible d'un membre
export enum MemberStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  BANNED = 'Banned'
}

// Rôles communautaires possibles
export enum CommunityRole {
  MEMBER = 'Member',
  MODERATOR = 'Moderator',
  ADMIN = 'Admin',
  CONTRIBUTOR = 'Contributor',
  MENTOR = 'Mentor'
} 