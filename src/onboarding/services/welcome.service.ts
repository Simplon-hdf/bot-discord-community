import { Client, TextChannel } from 'discord.js';
import { createWelcomeMessage } from '../components/welcome-message';
import { logDebug, logError } from '../../utils/error.utils';

export class WelcomeService {
  private static instance: WelcomeService;
  private welcomeChannelId: string | null = null;

  private constructor() {}

  public static getInstance(): WelcomeService {
    if (!WelcomeService.instance) {
      WelcomeService.instance = new WelcomeService();
    }
    return WelcomeService.instance;
  }

  public setWelcomeChannel(channelId: string): void {
    this.welcomeChannelId = channelId;
    logDebug('Welcome Service', `Canal d'accueil configuré: ${channelId}`);
  }

  public async sendWelcomeMessage(client: Client): Promise<void> {
    if (!this.welcomeChannelId) {
      logError('Welcome Service', 'Canal d\'accueil non configuré');
      return;
    }

    try {
      const channel = client.channels.cache.get(this.welcomeChannelId);
      
      if (!channel || !(channel instanceof TextChannel)) {
        logError('Welcome Service', 'Canal d\'accueil invalide ou non trouvé');
        return;
      }

      // Supprimer tous les messages existants du bot
      const messages = await channel.messages.fetch();
      const botMessages = messages.filter(msg => msg.author.id === client.user?.id);
      if (botMessages.size > 0) {
        logDebug('Welcome Service', 'Suppression des anciens messages...');
        await channel.bulkDelete(botMessages);
      }

      // Envoyer le nouveau message de bienvenue
      await channel.send(createWelcomeMessage());
      logDebug('Welcome Service', 'Nouveau message d\'accueil envoyé');

    } catch (error) {
      logError('Welcome Service', error);
    }
  }

  public getWelcomeChannel(client: Client): TextChannel | null {
    if (!this.welcomeChannelId) return null;
    const channel = client.channels.cache.get(this.welcomeChannelId);
    return channel instanceof TextChannel ? channel : null;
  }
} 