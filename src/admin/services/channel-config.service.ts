import { Channel, Client, ForumChannel } from 'discord.js';

export class ChannelConfigService {
  private static instance: ChannelConfigService;
  private resourceChannelId: string | null = null;

  private constructor() {}

  public static getInstance(): ChannelConfigService {
    if (!ChannelConfigService.instance) {
      ChannelConfigService.instance = new ChannelConfigService();
    }
    return ChannelConfigService.instance;
  }

  public setResourceChannel(channelId: string): void {
    this.resourceChannelId = channelId;
  }

  public getResourceChannel(client: Client): Channel | null {
    if (!this.resourceChannelId) return null;
    return client.channels.cache.get(this.resourceChannelId) || null;
  }

  public getResourceChannelId(): string | null {
    return this.resourceChannelId;
  }

  public async createResourceThread(client: Client, title: string, description: string) {
    const channel = this.getResourceChannel(client);
    
    if (!channel || !(channel instanceof ForumChannel)) {
      throw new Error('Canal des ressources non configuré ou invalide');
    }

    // Créer un nouveau post dans le forum
    const post = await channel.threads.create({
      name: title,
      message: {
        content: '📚 Nouvelle ressource !',
        embeds: [{
          title: title,
          description: description,
          color: 0x0099ff,
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Ressource partagée via le Bot Ressources'
          }
        }]
      },
      reason: 'Nouvelle ressource créée'
    });

    return post;
  }
} 