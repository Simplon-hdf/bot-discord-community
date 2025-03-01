/**
 * Types pour l'API des utilisateurs Discord
 */

// Type pour la création d'un utilisateur Discord
export interface DiscordUserCreateDto {
  uuidDiscord: string;
  discordUsername: string;
  discriminator: string;
}

// Type pour représenter un utilisateur Discord depuis l'API
export interface DiscordUserDto {
  uuidDiscord: string;
  discordUsername: string;
  discriminator: string;
  createdAt: string;
  updatedAt: string;
} 