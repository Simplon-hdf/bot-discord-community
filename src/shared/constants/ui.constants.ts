/**
 * Constantes communes pour l'interface utilisateur
 * Ces constantes peuvent être utilisées par tous les modules
 */

// Couleurs utilisées dans toute l'application
export const COLORS = {
  SIMPLON: 0x00313C,
  DEFAULT: '0099ff', // Bleu par défaut
  DANGER: 'ff0000',  // Rouge
  SUCCESS: '00ff00', // Vert
  WARNING: 'ffff00',  // Jaune
  INFO: '0099ff',    // Bleu
  SECONDARY: '95a5a6' // Gris
};

// Configuration des couleurs pour les ressources
export const RESOURCE_COLORS = [
  { label: '🔵 Bleu', value: COLORS.DEFAULT, description: 'Couleur par défaut' },
  { label: '🔴 Rouge', value: COLORS.DANGER, description: 'Pour les ressources importantes' },
  { label: '🟢 Vert', value: COLORS.SUCCESS, description: 'Pour les ressources validées' },
  { label: '🟡 Jaune', value: COLORS.WARNING, description: 'Pour les astuces et conseils' },
  { label: '🟣 Violet', value: '9b59b6', description: 'Pour les tutoriels' },
  { label: '🟠 Orange', value: 'e67e22', description: 'Pour les bonnes pratiques' },
  { label: '⚫ Noir', value: '34495e', description: 'Pour les ressources techniques' },
  { label: '🔘 Gris', value: COLORS.SECONDARY, description: 'Pour les ressources générales' }
]; 