export const RESOURCE_COLORS = [
    { label: '🔵 Bleu', value: '0x0099ff', description: 'Couleur par défaut' },
    { label: '🔴 Rouge', value: '0xff0000', description: 'Pour les ressources importantes' },
    { label: '🟢 Vert', value: '0x00ff00', description: 'Pour les ressources validées' },
    { label: '🟡 Jaune', value: '0xffff00', description: 'Pour les astuces et conseils' },
    { label: '🟣 Violet', value: '0x9b59b6', description: 'Pour les tutoriels' },
    { label: '🟠 Orange', value: '0xe67e22', description: 'Pour les bonnes pratiques' },
    { label: '⚫ Noir', value: '0x34495e', description: 'Pour les ressources techniques' },
    { label: '🔘 Gris', value: '0x95a5a6', description: 'Pour les ressources générales' }
];

// Les RESOURCE_TAGS ont été supprimés pour simplifier le processus

export const DEFAULT_COLOR = '0x0099ff';
export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 4000;
export const MIN_TAGS = 1;
export const MAX_TAGS = 3; 