import { Client, ForumChannel, WebhookClient, User, GuildMember } from 'discord.js';
import { formatResourceTitle } from '../../utils/format.utils';
import { logError, logDebug } from '../../utils/error.utils';
import { COLORS } from '../../shared/constants/ui.constants';
import { ResourceApiService } from '../../api/services/resource.service';
import { ResourceCreateDto } from '../../api/types/resource.types';
import { createResourceDisplayEmbed } from '../components/resource-components';
import { IResourceService } from '../types/resource.types';
import { MemberService } from '../../members/services/member.service';
import { ChannelService, ChannelType } from '../../core/services/channel-service';

/**
 * Service centralisé pour la gestion des ressources
 * Utilise directement les services API
 */
export class ResourceService implements IResourceService {
  private static instance: ResourceService;
  private resourceApiService: ResourceApiService;
  private channelService: ChannelService;
  private webhooks: Map<string, WebhookClient> = new Map();

  private constructor() {
    this.resourceApiService = ResourceApiService.getInstance();
    this.channelService = ChannelService.getInstance();
  }

  public static getInstance(): ResourceService {
    if (!ResourceService.instance) {
      ResourceService.instance = new ResourceService();
    }
    return ResourceService.instance;
  }

  /**
   * Récupère ou crée un webhook pour un canal de forum
   */
  private async getOrCreateWebhook(channel: ForumChannel): Promise<WebhookClient> {
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
      logError('Resource Service', `Erreur lors de la création du webhook: ${error}`);
      throw error;
    }
  }

  /**
   * Récupère le nom d'affichage d'un utilisateur (nickname ou username)
   * Utilise displayName qui prend en compte les paramètres du serveur
   */
  private getDisplayName(guildMember: GuildMember | null, user: User): string {
    if (!guildMember) {
      logDebug('GetDisplayName', `GuildMember est null, utilisation de username: ${user.username}`);
      return user.username;
    }
    
    // Préférer displayName qui est géré automatiquement par Discord.js pour retourner le bon nom
    const displayName = guildMember.displayName;
    logDebug('GetDisplayName', `GuildMember trouvé: nickname=${guildMember.nickname}, displayName=${displayName}, username=${user.username}`);
    
    return displayName;
  }

  /**
   * Crée une nouvelle ressource avec un nom d'affichage correct
   * @returns L'URL de la ressource créée ou null en cas d'échec
   */
  public async createResource(
    client: Client, 
    title: string, 
    description: string, 
    content: string,
    author: User, 
    tagIds: string[],
    color: string = COLORS.DEFAULT
  ): Promise<string | null> {
    try {
      // 1. Obtenir le serveur de l'auteur (on prend le premier serveur où l'auteur est présent)
      let guildId = null;
      let memberGuild = null;
      
      for (const guild of client.guilds.cache.values()) {
        try {
          const member = await guild.members.fetch({ user: author.id, force: false });
          if (member) {
            guildId = guild.id;
            memberGuild = guild;
            break;
          }
        } catch (error) {
          // Ignorer, l'utilisateur n'est pas dans ce serveur
        }
      }
      
      if (!guildId || !memberGuild) {
        logError('Resource Service', 'Impossible de trouver un serveur pour l\'auteur');
        return null;
      }
      
      // 2. Obtenir le canal de ressources
      const resourceChannel = this.channelService.getResourcesChannel(client, guildId);
      
      if (!resourceChannel) {
        logError('Resource Service', `Aucun canal de ressources trouvé pour le serveur ${guildId}`);
        return null;
      }

      // 3. Récupérer l'UUID membre à partir de l'ID Discord
      const memberService = MemberService.getInstance();
      const member = await memberService.getMember(author.id, guildId);
      
      if (!member) {
        logError('Resource Service', `Membre non trouvé dans la base de données pour Discord ID: ${author.id}`);
        return null;
      }
      
      // 4. Enregistrer la ressource dans l'API avec l'UUID membre correct
      const resourceDto: ResourceCreateDto = {
        uuidMember: member.uuidMember,
        title,
        description,
        content,
        status: 'active',
        tagIds: tagIds
      };
      
      logDebug('Create Resource', { data: resourceDto });
      
      // Créer d'abord la ressource dans l'API
      try {
        await this.resourceApiService.createResource(resourceDto);
      } catch (apiError) {
        logError('Resource Service', `L'API a refusé la création de la ressource: ${apiError}`);
        return null;
      }
      
      // 5. Récupérer le GuildMember pour avoir accès au nickname
      let guildMember = null;
      
      try {
        // Forcer une récupération fraîche du membre depuis l'API Discord
        guildMember = await memberGuild.members.fetch({ user: author.id, force: true });
        
        // Logs détaillés pour diagnostiquer le problème de nickname
        logDebug('Resource Service', `GuildMember récupéré: ID=${guildMember.id}, User=${guildMember.user.tag}`);
        logDebug('Resource Service', `Nickname=${guildMember.nickname}, DisplayName=${guildMember.displayName}`);
        logDebug('Resource Service', `Username=${guildMember.user.username}`);
      } catch (err) {
        logError('Resource Service', `Impossible de récupérer le GuildMember: ${err}`);
        // Continuer avec guildMember = null, nous utiliserons le username comme fallback
      }
      
      // 6. Créer l'embed pour la ressource
      const embed = createResourceDisplayEmbed(
        title,
        description,
        content,
        author,
        [], // Pas de tags
        color,
        guildMember
      );

      // 7. Publier la ressource via webhook seulement si l'API a accepté
      const webhook = await this.getOrCreateWebhook(resourceChannel);
      
      try {
        // Obtenir le nom d'affichage de l'utilisateur (nickname s'il existe, sinon username)
        const displayName = this.getDisplayName(guildMember, author);
        
        // Formater le titre du thread pour inclure le nom de l'auteur
        const formattedThreadTitle = `${displayName} | ${title}`;
        
        // Configuration simple du webhook avec le nom d'affichage de l'utilisateur
        const messageOptions = {
          username: displayName,  // Utiliser le nom d'affichage comme nom du webhook
          avatarURL: author.displayAvatarURL(),
          embeds: [embed],
          threadName: formattedThreadTitle
        };
        
        // Log pour vérifier les options exactes envoyées au webhook
        logDebug('Resource Service', `Publication par ${displayName} (avatar: ${author.displayAvatarURL()})`);
        
        // Envoyer via le webhook 
        const webhookMessage = await webhook.send(messageOptions);
        
        // 8. Générer l'URL de la ressource (URL du thread Discord)
        const resourceUrl = `https://discord.com/channels/${resourceChannel.guildId}/${webhookMessage.id}`;
        
        logDebug('Resource Service', `Ressource "${title}" créée avec succès par ${displayName} (ID: ${author.id}), URL: ${resourceUrl}`);
        return resourceUrl;
      } catch (error) {
        logError('Resource Service', `Erreur lors de l'envoi du webhook: ${error}`);
        throw error;
      }
    } catch (error) {
      logError('Resource Service', `Erreur lors de la création de la ressource: ${error}`);
      return null;
    }
  }
} 