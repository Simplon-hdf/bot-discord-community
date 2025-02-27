import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('delete-moderation')
    .setDescription('Supprimer une action de modération')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID de l\'action')
        .setRequired(true)),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 