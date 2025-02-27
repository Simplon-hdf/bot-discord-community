import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('comment')
    .setDescription('Gérer les commentaires')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Ajouter un commentaire')
        .addStringOption(option =>
          option
            .setName('resource-id')
            .setDescription('ID de la ressource')
            .setRequired(true)
        )
    ),
  
  async execute(interaction: any) {
    // Logique de la commande
  }
}; 