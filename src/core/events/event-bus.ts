import { ButtonInteraction } from 'discord.js';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Définition des types d'événements supportés par l'Event Bus
 */
export enum EventType {
  CREATE_RESOURCE_REQUESTED = 'create_resource_requested',
  // Ajouter d'autres types d'événements ici au besoin
}

/**
 * Interface pour les payloads d'événements
 */
export interface EventPayload {
  interaction?: ButtonInteraction;
  data?: any;
}

/**
 * Gestionnaire d'événements centralisé pour le découplage des modules
 * Implémente le pattern Médiateur/Event Bus
 */
export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Function[]> = new Map();
  
  private constructor() {
    logDebug('EventBus', 'Event Bus initialisé');
  }
  
  /**
   * Obtient l'instance singleton de l'Event Bus
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  /**
   * Abonne un callback à un type d'événement
   * @param eventType Le type d'événement à écouter
   * @param callback La fonction à appeler lorsque l'événement est émis
   */
  public subscribe(eventType: EventType, callback: (payload: EventPayload) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(callback);
    logDebug('EventBus', `Nouveau listener enregistré pour l'événement ${eventType}`);
  }
  
  /**
   * Émet un événement avec un payload
   * @param eventType Le type d'événement à émettre
   * @param payload Les données associées à l'événement
   */
  public publish(eventType: EventType, payload: EventPayload = {}): void {
    logDebug('EventBus', `Publication de l'événement ${eventType}`);
    
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)?.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          logError('EventBus', `Erreur dans le handler de l'événement ${eventType}: ${error}`);
        }
      });
    } else {
      logDebug('EventBus', `Aucun listener trouvé pour l'événement ${eventType}`);
    }
  }
  
  /**
   * Désabonne tous les callbacks pour un type d'événement
   * @param eventType Le type d'événement
   */
  public unsubscribeAll(eventType: EventType): void {
    this.listeners.delete(eventType);
    logDebug('EventBus', `Tous les listeners supprimés pour l'événement ${eventType}`);
  }
} 