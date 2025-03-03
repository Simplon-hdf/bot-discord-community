import { ButtonInteraction } from 'discord.js';
import { EventBus, EventType, EventPayload } from '../../core/events/event-bus';
import { logDebug, logError } from '../../utils/error.utils';
import { openResourceCreateModal } from './resource-modal-handler';

/**
 * Initialise les écouteurs d'événements pour le module Resources
 */
export function initializeResourceEventListeners(): void {
  logDebug('Resources', 'Initialisation des écouteurs d\'événements du module Resources');
  
  const eventBus = EventBus.getInstance();
  
  // S'abonner à l'événement de création de ressource
  eventBus.subscribe(EventType.CREATE_RESOURCE_REQUESTED, async (payload: EventPayload) => {
    try {
      if (!payload.interaction) {
        logError('Resources', 'Événement CREATE_RESOURCE_REQUESTED reçu sans interaction');
        return;
      }
      
      const interaction = payload.interaction as ButtonInteraction;
      logDebug('Resources', `Traitement de l'événement CREATE_RESOURCE_REQUESTED pour ${interaction.user.tag}`);
      
      // Appeler la fonction pour ouvrir le modal de création de ressource
      await openResourceCreateModal(interaction);
    } catch (error) {
      logError('Resources', `Erreur lors du traitement de l'événement CREATE_RESOURCE_REQUESTED: ${error}`);
    }
  });
  
  logDebug('Resources', 'Écouteurs d\'événements du module Resources initialisés avec succès');
} 