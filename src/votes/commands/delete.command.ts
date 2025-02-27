import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('delete-vote')
    .setDescription('Supprimer un vote')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID du vote')
        .setRequired(true)),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 