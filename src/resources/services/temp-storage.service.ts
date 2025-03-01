interface TempResourceData {
  title: string;
  description: string;
  color: string;
  userId: string;
  timestamp: number;
  selectedTags?: string[];
  url?: string;
  guildId?: string; // Nous conservons ce champ car il peut être utilisé lors de la création de la ressource
}

export class TempStorageService {
  private static instance: TempStorageService;
  private tempData: Map<string, TempResourceData>;

  private constructor() {
    this.tempData = new Map();
  }

  public static getInstance(): TempStorageService {
    if (!TempStorageService.instance) {
      TempStorageService.instance = new TempStorageService();
    }
    return TempStorageService.instance;
  }

  public setResourceData(userId: string, data: TempResourceData): void {
    this.tempData.set(userId, data);
  }

  public getResourceData(userId: string): TempResourceData | undefined {
    return this.tempData.get(userId);
  }

  public deleteResourceData(userId: string): void {
    this.tempData.delete(userId);
  }
} 