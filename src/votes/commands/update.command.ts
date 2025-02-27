import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('update-vote')
    .setDescription('Mettre à jour un vote')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID du vote')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Nouveau type de vote')
        .setRequired(true)
        .addChoices(
          { name: 'Pour', value: 'up' },
          { name: 'Contre', value: 'down' }
        )),
  
  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 