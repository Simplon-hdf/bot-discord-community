import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface LogDetails {
    type: string;
    [key: string]: any;
}

export interface Log {
    id: string;
    memberId: string;
    memberName: string;
    action: string;
    details: LogDetails;
    timestamp: string;
}

export class LogService {
    private static instance: LogService;
    private readonly dataDir: string = 'data';
    private readonly logPath: string = path.join(this.dataDir, 'logs.json');
    private logs: Log[] = [];

    private constructor() {
        this.initializeLogStorage();
        this.loadLogs();
    }

    public static getInstance(): LogService {
        if (!LogService.instance) {
            LogService.instance = new LogService();
        }
        return LogService.instance;
    }

    private initializeLogStorage(): void {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir);
        }
        if (!fs.existsSync(this.logPath)) {
            fs.writeFileSync(this.logPath, JSON.stringify({ logs: [] }, null, 2));
        }
    }

    private loadLogs(): void {
        try {
            const data = fs.readFileSync(this.logPath, 'utf-8');
            const parsedData = JSON.parse(data);
            this.logs = parsedData.logs || [];
        } catch (error) {
            console.error('Erreur lors du chargement des logs:', error);
            this.logs = [];
        }
    }

    private saveLogs(): void {
        try {
            fs.writeFileSync(this.logPath, JSON.stringify({ logs: this.logs }, null, 2));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des logs:', error);
        }
    }

    public addLog(memberId: string, memberName: string, action: string, details: LogDetails): Log {
        const log: Log = {
            id: uuidv4(),
            memberId,
            memberName,
            action,
            details,
            timestamp: new Date().toISOString()
        };

        this.logs.push(log);
        this.saveLogs();
        return log;
    }

    public getLogs(filters?: {
        memberId?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
    }): Log[] {
        let filteredLogs = [...this.logs];

        if (filters) {
            if (filters.memberId) {
                filteredLogs = filteredLogs.filter(log => log.memberId === filters.memberId);
            }
            if (filters.action) {
                filteredLogs = filteredLogs.filter(log => log.action === filters.action);
            }
            if (filters.startDate) {
                filteredLogs = filteredLogs.filter(log => 
                    new Date(log.timestamp) >= filters.startDate!
                );
            }
            if (filters.endDate) {
                filteredLogs = filteredLogs.filter(log => 
                    new Date(log.timestamp) <= filters.endDate!
                );
            }
        }

        return filteredLogs;
    }

    public getLogsByMember(memberId: string): Log[] {
        return this.logs.filter(log => log.memberId === memberId);
    }

    public getLogsByAction(action: string): Log[] {
        return this.logs.filter(log => log.action === action);
    }

    public getRecentLogs(limit: number = 10): Log[] {
        return [...this.logs]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }

    public clearOldLogs(daysToKeep: number = 30): void {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        this.logs = this.logs.filter(log => 
            new Date(log.timestamp) >= cutoffDate
        );
        this.saveLogs();
    }
} 