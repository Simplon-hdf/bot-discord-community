import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export function createWelcomeEmbed() {
  return new EmbedBuilder()
    .setColor(0x00313C)
    .setTitle('Bienvenue chez Simplon')
    .setThumbnail('https://evenement.simplon.co/hs-fs/hubfs/SIMPLON_LOGO_2024%20(1).png?width=1920&height=592&name=SIMPLON_LOGO_2024%20(1).png')
    .setDescription(`Bienvenue dans l'espace d'échange et de collaboration de la communauté Simplon!`)
    .addFields(
      {
        name: '🤝 Notre communauté',
        value: '• Entraide et collaboration\n• Partage de connaissances\n• Évolution collective',
        inline: true
      },
      {
        name: '📚 Ressources partagées',
        value: '• Documentation\n• Tutoriels\n• Outils\n• Bonnes pratiques',
        inline: true
      },
      {
        name: '🏆 Système de progression',
        value: '• Gagnez des niveaux en partageant\n• Votez pour les meilleures ressources\n• Débloquez des badges et récompenses\n• Suivez votre évolution',
        inline: false
      }
    )
    .setFooter({ 
      text: 'Communauté Simplon',
      iconURL: 'https://evenement.simplon.co/hs-fs/hubfs/SIMPLON_LOGO_2024%20(1).png?width=1920&height=592&name=SIMPLON_LOGO_2024%20(1).png'
    });
}

export function createJoinButton() {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('join_community')
        .setLabel('Rejoindre la communauté')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('👋')
    );
}

export function createWelcomeMessage() {
  return {
    embeds: [createWelcomeEmbed()],
    components: [createJoinButton()]
  };
}