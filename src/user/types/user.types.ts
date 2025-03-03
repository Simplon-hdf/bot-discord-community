/**
 * Interface représentant le profil d'un utilisateur avec ses statistiques et progressions
 */
export interface UserProfile {
  userId: string;
  username: string;
  xp: number;
  level: number;
  badges: string[];
  resourcesShared: number;
  resourcesVoted: number;
  joinedAt: Date;
  lastActive: Date;
}

/**
 * Constantes liées aux utilisateurs
 */
export const USER_BADGES = {
  NEWCOMER: '🔰 Nouveau',
  CONTRIBUTOR: '📝 Contributeur',
  SHARER: '🌐 Partageur',
  HELPER: '🤝 Aidant',
  EXPERT: '🏆 Expert',
  AMBASSADOR: '🎭 Ambassadeur',
};

/**
 * Récompenses XP pour différentes actions
 */
export const XP_REWARDS = {
  SHARE_RESOURCE: 50,
  VOTE_RESOURCE: 10,
  COMMENT_RESOURCE: 5,
  DAILY_LOGIN: 2,
}; 