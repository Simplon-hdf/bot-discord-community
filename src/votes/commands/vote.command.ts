import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Voter pour une ressource')
    .addStringOption(option =>
      option
        .setName('resource-id')
        .setDescription('ID de la ressource')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Type de vote')
        .setRequired(true)
        .addChoices(
          { name: 'Pour', value: 'up' },
          { name: 'Contre', value: 'down' }
        )
    ),
  
  async execute(interaction: any) {
    // Logique de la commande
  }
}; 