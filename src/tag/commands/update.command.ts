import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('update-tag')
    .setDescription('Mettre à jour un tag')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Nom du tag à mettre à jour')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('new-name')
        .setDescription('Nouveau nom du tag'))
    .addStringOption(option =>
      option
        .setName('content')
        .setDescription('Nouveau contenu du tag')),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 