import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Signaler un contenu')
    .addStringOption(option =>
      option
        .setName('resource-id')
        .setDescription('ID de la ressource à signaler')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Raison du signalement')
        .setRequired(true)
    ),
  
  async execute(interaction: any) {
    // Logique de la commande
  }
}; 