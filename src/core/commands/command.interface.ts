import { ChatInputCommandInteraction } from 'discord.js';

/**
 * Interface représentant une commande slash standardisée
 */
export interface Command {
  /**
   * La définition de la commande au format JSON (résultat de .toJSON())
   */
  data: any;
  
  /**
   * Indique si la commande est globale (utilisable partout, y compris en DM)
   * ou limitée aux serveurs
   */
  isGlobal: boolean;
  
  /**
   * Fonction qui gère l'exécution de la commande
   */
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
} 