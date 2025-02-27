import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('delete-xp')
    .setDescription('Supprimer une transaction XP')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID de la transaction')
        .setRequired(true)),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 