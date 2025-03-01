/**
 * Types pour l'API des guilds (serveurs Discord)
 */

// Type pour la création d'une guild
export interface GuildCreateDto {
  uuid: string;
  name: string;
  memberCount: string;
  configuration?: Record<string, any>;
}

// Type pour représenter une guild depuis l'API
export interface GuildDto {
  uuid: string;
  name: string;
  memberCount: string;
  configuration?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
} 