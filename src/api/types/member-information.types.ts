/**
 * Types pour l'API des informations membres
 */

// Type pour la création d'informations membre
export interface MemberInformationCreateDto {
  uuidMember?: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Type pour représenter les informations d'un membre depuis l'API
export interface MemberInformationDto {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
} 