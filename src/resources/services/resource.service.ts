import { Client, ForumChannel, WebhookClient, User, ThreadAutoArchiveDuration } from 'discord.js';
import { ChannelConfigService } from '../../admin/services/channel-config.service';
import { formatTags, formatEmbedColor, formatResourceTitle } from '../../utils/format.utils';
import { getDisplayName, createEmbedFooter, createInitialMessage } from '../../utils/discord.utils';
import { logError, logDebug } from '../../utils/error.utils';
import { DEFAULT_COLOR } from '../../constants/resource.constants';

export class ResourceService {
  private static instance: ResourceService;
  private webhooks: Map<string, WebhookClient> = new Map();

  private constructor() {}

  public static getInstance(): ResourceService {
    if (!ResourceService.instance) {
      ResourceService.instance = new ResourceService();
    }
    return ResourceService.instance;
  }

  private async getOrCreateWebhook(channel: ForumChannel) {
    // Vérifier si on a déjà un webhook pour ce canal
    const existingWebhook = this.webhooks.get(channel.id);
    if (existingWebhook) return existingWebhook;

    try {
      // Chercher un webhook existant du bot
      const webhooks = await channel.fetchWebhooks();
      const webhook = webhooks.find(wh => wh.owner?.id === channel.client.user?.id);

      if (webhook) {
        const webhookClient = new WebhookClient({ id: webhook.id, token: webhook.token! });
        this.webhooks.set(channel.id, webhookClient);
        return webhookClient;
      }

      // Créer un nouveau webhook si aucun n'existe
      const newWebhook = await channel.createWebhook({
        name: 'Resource Publisher',
        avatar: channel.client.user?.avatarURL() || undefined
      });

      const webhookClient = new WebhookClient({ id: newWebhook.id, token: newWebhook.token! });
      this.webhooks.set(channel.id, webhookClient);
      return webhookClient;
    } catch (error) {
      logError('Création/récupération du webhook', error);
      throw error;
    }
  }

  public async createResource(client: Client, title: string, description: string, author: User, tags: string[], color: string = DEFAULT_COLOR) {
    const channelConfig = ChannelConfigService.getInstance();
    const channel = channelConfig.getResourceChannel(client);
    
    if (!channel || !(channel instanceof ForumChannel)) {
      throw new Error('Canal des ressources non configuré ou invalide');
    }

    try {
      // Récupérer le nom d'affichage de l'utilisateur
      const guild = channel.guild;
      const member = await guild.members.fetch(author.id);
      const displayName = getDisplayName(member);

      logDebug('Création de ressource', { title, author: displayName, tags, color });

      // Créer d'abord le thread dans le forum
      const thread = await channel.threads.create({
        name: formatResourceTitle(displayName, title),
        message: {
          content: createInitialMessage(displayName),
        },
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      });

      // Obtenir ou créer le webhook
      const webhook = await this.getOrCreateWebhook(channel);

      // Envoyer le message détaillé dans le thread via le webhook
      await webhook.send({
        embeds: [{
          title: title,
          description: description,
          color: formatEmbedColor(color),
          fields: [
            {
              name: 'Tags',
              value: formatTags(tags),
              inline: true
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: createEmbedFooter(displayName)
          }
        }],
        username: displayName,
        avatarURL: author.displayAvatarURL(),
        threadId: thread.id
      });

      logDebug('Ressource créée avec succès', { threadId: thread.id, url: thread.url });
      return thread;
    } catch (error) {
      logError('Création de ressource', error);
      throw error;
    }
  }
} 