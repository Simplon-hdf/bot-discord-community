/**
 * Registre central des identifiants d'interaction
 * Permet d'éviter les collisions entre les différents modules
 */

// Préfixes pour les modules
export const MODULE_PREFIX = {
  RESOURCE: 'resource',
  TAG: 'tag',
  DASHBOARD: 'dashboard',
  ADMIN: 'admin',
  MEMBER: 'member',
  ONBOARDING: 'onboarding'
};

// Identifiants pour les interactions de ressources
export const RESOURCE_IDS = {
  // Modaux
  MODAL_CREATE: 'resource_api_modal',
  
  // Menus de sélection
  SELECT_COLOR: 'resource_color_select',
  SELECT_TAG: 'resource_tag_select',
  
  // Boutons
  BTN_CREATE: 'create_resource',
  BTN_CREATE_DASHBOARD: 'create_resource_dashboard',
  BTN_CONFIRM: 'confirm_resource',
  BTN_CANCEL: 'cancel_resource',
  BTN_CONTINUE_COLOR: 'continue_to_color'
};

// Identifiants pour les interactions de tags
export const TAG_IDS = {
  // Modaux
  MODAL_CREATE: 'tag_creation_modal',
  
  // Boutons
  BTN_CREATE: 'create_tag',
  BTN_CONFIRM: 'confirm_tags'
};

// Identifiants pour les interactions de tableau de bord
export const DASHBOARD_IDS = {
  BTN_REFRESH: 'refresh_dashboard',
  BTN_VIEW_COMMUNITY: 'view_community',
  BTN_SHOW: 'show_dashboard'
};

// Identifiants pour les interactions d'onboarding
export const ONBOARDING_IDS = {
  BTN_JOIN: 'join_community',
  BTN_START: 'start_community'
}; 