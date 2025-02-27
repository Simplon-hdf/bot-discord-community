import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('update-moderation')
    .setDescription('Mettre à jour une action de modération')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID de l\'action')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Nouvelle raison')
        .setRequired(true))
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Utilisateur concerné')
        .setRequired(true)),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 