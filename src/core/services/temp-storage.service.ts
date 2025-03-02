/**
 * Interface pour les données temporaires de ressource
 * Cette interface est déplacée ici depuis le module ressources pour être plus générique
 */
export interface TempResourceData {
  title: string;
  description: string;
  color: string;
  userId: string;
  timestamp: number;
  url?: string;
  guildId?: string;
  selectedTags?: string[]; 
}

/**
 * Interface pour les données stockées avec leur timestamp
 */
interface TimestampedData {
  data: any;
  timestamp: number;
}

/**
 * Service générique de stockage temporaire en mémoire
 * Utilisé par différents modules pour stocker des données temporaires de session
 */
export class TempStorageService {
  private static instance: TempStorageService;
  private tempData: Map<string, TimestampedData>;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Constantes de configuration pour le nettoyage
  // Durée de conservation des données en millisecondes (1 heure)
  private readonly DATA_EXPIRY_MS = 60 * 60 * 1000; 
  // Fréquence du nettoyage en millisecondes (30 minutes)
  private readonly CLEANUP_INTERVAL_MS = 30 * 60 * 1000;

  private constructor() {
    this.tempData = new Map();
    
    // Démarrer le nettoyage périodique
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredData();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Obtient l'instance unique du service (Singleton)
   */
  public static getInstance(): TempStorageService {
    if (!TempStorageService.instance) {
      TempStorageService.instance = new TempStorageService();
    }
    return TempStorageService.instance;
  }
  
  /**
   * Nettoie les données expirées
   */
  private cleanupExpiredData(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    this.tempData.forEach((value, key) => {
      // Vérifier si les données sont expirées
      if (now - value.timestamp > this.DATA_EXPIRY_MS) {
        this.tempData.delete(key);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`[TempStorage] Nettoyage: ${cleanedCount} entrées périmées supprimées`);
    }
  }

  /**
   * Méthodes spécifiques pour les ressources - conservées pour compatibilité
   */
  public setResourceData(userId: string, data: TempResourceData): void {
    this.tempData.set(userId, {
      data,
      timestamp: Date.now()
    });
  }

  public getResourceData(userId: string): TempResourceData | undefined {
    const timestampedData = this.tempData.get(userId);
    return timestampedData ? timestampedData.data : undefined;
  }

  public deleteResourceData(userId: string): void {
    this.tempData.delete(userId);
  }

  /**
   * Méthodes génériques pour le stockage temporaire de données
   */
  public async storeData(key: string, data: any, merge: boolean = false): Promise<void> {
    if (merge && this.tempData.has(key)) {
      const existingTimestampedData = this.tempData.get(key);
      if (existingTimestampedData) {
        this.tempData.set(key, {
          data: { ...existingTimestampedData.data, ...data },
          timestamp: Date.now() // Mise à jour du timestamp lors de la modification
        });
      }
    } else {
      this.tempData.set(key, {
        data,
        timestamp: Date.now()
      });
    }
  }

  public async getData(key: string): Promise<any> {
    const timestampedData = this.tempData.get(key);
    return timestampedData ? timestampedData.data : undefined;
  }

  public async deleteData(key: string): Promise<void> {
    this.tempData.delete(key);
  }
  
  /**
   * Arrête le nettoyage périodique en cas de besoin
   * (utile pour les tests ou lors de l'arrêt propre de l'application)
   */
  public stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
} 