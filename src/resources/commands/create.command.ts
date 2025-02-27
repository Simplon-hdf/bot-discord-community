import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('create-resource')
    .setDescription('Créer une nouvelle ressource'),
  
  async execute(interaction: any) {
    // Logique de la commande
  }
}; 