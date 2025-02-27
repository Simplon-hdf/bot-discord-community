import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('delete-tag')
    .setDescription('Supprimer un tag')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Nom du tag à supprimer')
        .setRequired(true)),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 