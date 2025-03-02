import { Client, User } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { LogService } from './log-service';

interface UserXP {
    userId: string;
    xp: number;
    level: number;
    badges: string[];
}

export class XPService {
    private static instance: XPService;
    private xpData: Map<string, UserXP> = new Map();
    private readonly dataPath: string;
    private readonly dataDir: string;
    private readonly logService: LogService;

    private constructor() {
        this.dataDir = 'data';
        this.dataPath = path.join(this.dataDir, 'xp.json');
        this.logService = LogService.getInstance();
        this.initializeDataStorage();
        this.loadData();
    }

    private initializeDataStorage(): void {
        console.log('Initialisation du stockage XP...');
        console.log('Dossier data:', this.dataDir);
        console.log('Fichier XP:', this.dataPath);
        
        // Créer le dossier data s'il n'existe pas
        if (!fs.existsSync(this.dataDir)) {
            console.log('Création du dossier data');
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        // Créer le fichier xp.json s'il n'existe pas
        if (!fs.existsSync(this.dataPath)) {
            console.log('Création du fichier xp.json');
            fs.writeFileSync(this.dataPath, '{}', 'utf-8');
        }
    }

    public static getInstance(): XPService {
        if (!XPService.instance) {
            XPService.instance = new XPService();
        }
        return XPService.instance;
    }

    private loadData(): void {
        try {
            const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8'));
            this.xpData = new Map(Object.entries(data));
            console.log('Données XP chargées avec succès');
        } catch (error) {
            console.error('Erreur lors du chargement des données XP:', error);
            this.xpData = new Map();
        }
    }

    private saveData(): void {
        try {
            const data = Object.fromEntries(this.xpData);
            fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
            console.log('Données XP sauvegardées avec succès');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des données XP:', error);
        }
    }

    private calculateLevel(xp: number): number {
        // Formule logarithmique basée sur 150 000 XP pour niveau 50
        return Math.min(50, Math.floor(Math.pow(xp / 100, 0.4)));
    }

    private getBadgesForLevel(level: number): string[] {
        const badges: string[] = [];
        if (level >= 1) badges.push('SimplonNovice');    
        if (level >= 10) badges.push('SimplonInitié');    
        if (level >= 20) badges.push('SimplonChampion');   
        if (level >= 30) badges.push('SimplonLeader');     
        if (level >= 40) badges.push('SimplonMaître');    
        if (level >= 50) badges.push('Simplonoré');        
        return badges;
    }

    private getUserData(userId: string): UserXP {
        if (!this.xpData.has(userId)) {
            this.xpData.set(userId, {
                userId,
                xp: 0,
                level: 0,
                badges: []
            });
            this.saveData(); // Sauvegarder immédiatement les nouvelles données
        }
        return this.xpData.get(userId)!;
    }

    public addXP(userId: string, amount: number, username: string = 'Unknown'): UserXP {
        console.log(`Ajout de ${amount} XP pour l'utilisateur ${userId}`);
        const userData = this.getUserData(userId);
        const oldLevel = userData.level;

        userData.xp = Math.max(0, userData.xp + amount);
        userData.level = this.calculateLevel(userData.xp);
        userData.badges = this.getBadgesForLevel(userData.level);

        this.xpData.set(userId, userData);
        this.saveData();

        // Log les changements importants
        if (amount > 0) {
            this.logService.addLog(userId, username, 'XP_GAIN', {
                type: 'xp_modification',
                amount,
                newTotal: userData.xp
            });
        } else if (amount < 0) {
            this.logService.addLog(userId, username, 'XP_LOSS', {
                type: 'xp_modification',
                amount,
                newTotal: userData.xp
            });
        }

        if (userData.level > oldLevel) {
            this.logService.addLog(userId, username, 'LEVEL_UP', {
                type: 'level_change',
                oldLevel,
                newLevel: userData.level
            });
        }

        console.log(`Nouveau total d'XP pour ${userId}: ${userData.xp}`);
        return userData;
    }

    public removeXP(userId: string, amount: number): UserXP {
        return this.addXP(userId, -amount);
    }

    public getLeaderboard(): UserXP[] {
        return Array.from(this.xpData.values())
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 10);
    }

    public getUserProfile(userId: string): UserXP {
        return this.getUserData(userId);
    }

    public getXPForNextLevel(currentLevel: number): number {
        if (currentLevel >= 50) return Infinity;
        // Inverse de la formule de niveau
        // XP = 100 * (niveau + 1)^(1/0.4)
        return Math.floor(100 * Math.pow(currentLevel + 1, 2.5));
    }

    public addBadge(userId: string, badge: string, username: string = 'Unknown'): UserXP {
        const userData = this.getUserData(userId);
        if (!userData.badges.includes(badge)) {
            userData.badges.push(badge);
            this.xpData.set(userId, userData);
            this.saveData();

            this.logService.addLog(userId, username, 'BADGE_EARNED', {
                type: 'badge_addition',
                badge
            });
        }
        return userData;
    }

    public removeBadge(userId: string, badge: string, username: string = 'Unknown'): UserXP {
        const userData = this.getUserData(userId);
        userData.badges = userData.badges.filter(b => b !== badge);
        this.xpData.set(userId, userData);
        this.saveData();

        this.logService.addLog(userId, username, 'BADGE_REMOVED', {
            type: 'badge_removal',
            badge
        });

        return userData;
    }
} 