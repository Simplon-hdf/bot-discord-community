import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('delete-report')
    .setDescription('Supprimer un signalement')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID du signalement')
        .setRequired(true)),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 