import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('delete-comment')
    .setDescription('Supprimer un commentaire')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID du commentaire')
        .setRequired(true)),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 