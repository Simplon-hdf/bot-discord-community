import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('delete-resource')
    .setDescription('Supprimer une ressource')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID de la ressource')
        .setRequired(true)),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 