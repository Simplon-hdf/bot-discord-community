/**
 * Constantes communes pour les formulaires
 * Ces constantes peuvent être utilisées par les modules ayant des formulaires
 */

// Limites de caractères pour les champs de formulaire
export const FORM_LIMITS = {
  // Ressources
  RESOURCE_TITLE_MAX: 50,      // Limité à 50 car c'est un varchar(50) dans l'API
  RESOURCE_DESCRIPTION_MAX: 4000,
  RESOURCE_CONTENT_MAX: 2000,
  
  // Tags
  TAG_NAME_MIN: 2,
  TAG_NAME_MAX: 30,
  TAG_DESCRIPTION_MAX: 100,
  
  // Sélection de tags
  MIN_TAGS: 1,
  MAX_TAGS: 3
}; 