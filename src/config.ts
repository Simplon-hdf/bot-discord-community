import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Vérifier que les variables requises existent
if (!process.env.DISCORD_TOKEN) {
    throw new Error('Le token Discord est manquant dans le fichier .env');
}

if (!process.env.API_URL) {
    throw new Error('L\'URL de l\'API est manquante dans le fichier .env (API_URL)');
}

export const CONFIG = {
    token: process.env.DISCORD_TOKEN,
    environment: process.env.NODE_ENV || 'development',
    api: {
        baseUrl: process.env.API_URL,
        timeout: parseInt(process.env.API_TIMEOUT || '5000')
    }
} as const;