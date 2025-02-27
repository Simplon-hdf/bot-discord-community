import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('update-xp')
    .setDescription('Mettre à jour une transaction XP')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID de la transaction')
        .setRequired(true))
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Nouveau montant d\'XP')
        .setRequired(true))
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Nouvel utilisateur')
        .setRequired(true)),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 