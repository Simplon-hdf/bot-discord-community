import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('update-resource')
    .setDescription('Mettre à jour une ressource')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID de la ressource')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('Nouveau titre'))
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Nouvelle description'))
    .addStringOption(option =>
      option
        .setName('url')
        .setDescription('Nouvelle URL')),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 