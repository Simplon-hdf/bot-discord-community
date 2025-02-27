import dotenv from 'dotenv';
import { config } from 'process';

// Charger les variables d'environnement
dotenv.config();

// Vérifier que le token existe
if (!process.env.DISCORD_TOKEN) {
    throw new Error('Le token Discord est manquant dans le fichier .env');
}

export const CONFIG = {
    token: process.env.DISCORD_TOKEN,
    environment: process.env.NODE_ENV || 'development'
} as const; 