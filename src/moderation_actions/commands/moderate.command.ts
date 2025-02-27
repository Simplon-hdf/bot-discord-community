import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('moderate')
    .setDescription('Actions de modération')
    .addSubcommand(subcommand =>
      subcommand
        .setName('warn')
        .setDescription('Avertir un utilisateur')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('L\'utilisateur à avertir')
            .setRequired(true)
        )
    ),
  
  async execute(interaction: any) {
    // Logique de la commande
  }
}; 