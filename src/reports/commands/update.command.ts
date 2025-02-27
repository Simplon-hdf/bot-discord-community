import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('update-report')
    .setDescription('Mettre à jour un signalement')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID du signalement')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Nouvelle raison du signalement')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('status')
        .setDescription('Nouveau statut du signalement')
        .setRequired(true)
        .addChoices(
          { name: 'En attente', value: 'pending' },
          { name: 'Résolu', value: 'resolved' },
          { name: 'Rejeté', value: 'rejected' }
        )),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 