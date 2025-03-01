import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Client, ForumChannel, Guild, TextChannel } from 'discord.js';
import { ChannelConfigService } from './channel-config.service';
import { logDebug, logError } from '../../utils/error.utils';

export class SetupService {
  private static instance: SetupService;
  private welcomeChannelId: string | null = null;
  private forumChannelId: string | null = null;

  private constructor() {}

  public static getInstance(): SetupService {
    if (!SetupService.instance) {
      SetupService.instance = new SetupService();
    }
    return SetupService.instance;
  }

  public async checkAndSetupBot(client: Client, guild: Guild) {
    try {
      console.log('[DEBUG] Début de la configuration pour le serveur:', guild.name);

      // Vérifier si les canaux existent déjà
      const existingWelcomeChannel = guild.channels.cache.find(
        channel => channel.name === '👋-bienvenue' && channel.type === ChannelType.GuildText
      );

      const existingForumChannel = guild.channels.cache.find(
        channel => channel.name === '📚-ressources' && channel.type === ChannelType.GuildForum
      );

      // Mettre à jour les IDs si les canaux existent
      if (existingWelcomeChannel) {
        this.welcomeChannelId = existingWelcomeChannel.id;
        console.log('[DEBUG] Canal de bienvenue existant trouvé:', this.welcomeChannelId);
      }

      if (existingForumChannel) {
        this.forumChannelId = existingForumChannel.id;
        console.log('[DEBUG] Forum des ressources existant trouvé:', this.forumChannelId);
        
        // S'assurer que le ChannelConfigService est mis à jour
        const channelConfig = ChannelConfigService.getInstance();
        channelConfig.setResourceChannel(existingForumChannel.id);
        console.log('[DEBUG] Canal des ressources configuré dans le service:', existingForumChannel.id);
      }

      // Créer les canaux manquants si nécessaire
      if (!this.welcomeChannelId) {
        console.log('[DEBUG] Création du canal de bienvenue...');
        const welcomeChannel = await this.setupWelcomeChannel(guild);
        console.log('[DEBUG] Canal de bienvenue créé:', welcomeChannel.id);
      }

      if (!this.forumChannelId) {
        console.log('[DEBUG] Création du forum des ressources...');
        const forumChannel = await this.setupForumChannel(guild);
        console.log('[DEBUG] Forum des ressources créé:', forumChannel.id);
        
        // Configurer le service de canal
        const channelConfig = ChannelConfigService.getInstance();
        channelConfig.setResourceChannel(forumChannel.id);
        console.log('[DEBUG] Canal des ressources configuré dans le service:', forumChannel.id);
      }

      // S'assurer que le message de bienvenue existe
      await this.ensureWelcomeMessage(client);
      console.log('[DEBUG] Configuration terminée avec succès');

    } catch (error) {
      console.error('[ERROR] Erreur lors du setup:', error);
      throw error;
    }
  }

  private async setupWelcomeChannel(guild: Guild): Promise<TextChannel> {
    const welcomeChannel = await guild.channels.create({
      name: '👋-bienvenue',
      type: ChannelType.GuildText,
      topic: 'Canal de bienvenue et d\'information sur le bot',
      position: 0 // Le mettre en haut de la liste des canaux
    });

    this.welcomeChannelId = welcomeChannel.id;
    return welcomeChannel;
  }

  private async setupForumChannel(guild: Guild): Promise<ForumChannel> {
    const forumChannel = await guild.channels.create({
      name: '📚-ressources',
      type: ChannelType.GuildForum,
      topic: 'Forum des ressources partagées par la communauté',
      position: 1, // Le mettre juste après le canal de bienvenue
      availableTags: [
        { name: '📚 Documentation', moderated: true },
        { name: '🎓 Tutoriel', moderated: true },
        { name: '🛠️ Outil', moderated: true },
        { name: '📝 Article', moderated: true },
        { name: '�� Vidéo', moderated: true },
        { name: '⚡ Astuce', moderated: true },
        { name: '🎯 Bonne pratique', moderated: true },
        { name: '🔗 Lien utile', moderated: true }
      ]
    });

    this.forumChannelId = forumChannel.id;
    return forumChannel;
  }

  private async ensureWelcomeMessage(client: Client) {
    const welcomeChannel = this.getWelcomeChannel(client);
    if (!welcomeChannel) {
      logError('Welcome Message', 'Canal de bienvenue non trouvé');
      return;
    }

    try {
      // Vérifier si un message de bienvenue existe déjà
      const messages = await welcomeChannel.messages.fetch({ limit: 10 });
      const existingWelcomeMessage = messages.find(msg => 
        msg.author.id === client.user?.id && 
        msg.embeds[0]?.title === '👋 Bienvenue sur le Bot Ressources !'
      );

      if (!existingWelcomeMessage) {
        logDebug('Welcome Message', 'Création du message de bienvenue...');
        
        // Obtenir l'ID du canal des ressources depuis le ChannelConfigService
        const channelConfig = ChannelConfigService.getInstance();
        const resourceChannelId = channelConfig.getResourceChannelId();

        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('create_resource')
              .setLabel('Créer une ressource')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📚')
          );

        await welcomeChannel.send({
          embeds: [{
            title: '👋 Bienvenue sur le Bot Ressources !',
            description: `
Ce bot vous permet de partager et d'organiser facilement des ressources avec la communauté.

**Fonctionnalités principales :**
• Création de ressources avec titre et description
• Organisation automatique dans des threads dédiés
• Discussions et commentaires sur chaque ressource
• Système de catégorisation et de recherche

**Comment utiliser le bot ?**
1. Cliquez sur le bouton "Créer une ressource" ci-dessous
2. Remplissez le formulaire avec les détails de votre ressource
3. Le bot créera automatiquement un thread dédié à votre ressource

Toutes les ressources sont disponibles dans le canal <#${resourceChannelId || 'en cours de configuration'}>.
            `,
            color: 0x5865F2
          }],
          components: [row]
        });
        logDebug('Welcome Message', 'Message de bienvenue créé');
      } else {
        logDebug('Welcome Message', 'Message de bienvenue déjà existant');
      }
    } catch (error) {
      logError('Welcome Message', error);
      throw error;
    }
  }

  public getWelcomeChannel(client: Client): TextChannel | null {
    if (!this.welcomeChannelId) return null;
    const channel = client.channels.cache.get(this.welcomeChannelId);
    return channel instanceof TextChannel ? channel : null;
  }

  public getForumChannel(client: Client): ForumChannel | null {
    if (!this.forumChannelId) return null;
    const channel = client.channels.cache.get(this.forumChannelId);
    return channel instanceof ForumChannel ? channel : null;
  }
} 