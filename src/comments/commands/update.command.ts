import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('update-comment')
    .setDescription('Mettre à jour un commentaire')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID du commentaire')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('content')
        .setDescription('Nouveau contenu du commentaire')
        .setRequired(true)),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 