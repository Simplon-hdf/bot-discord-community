import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('xp')
    .setDescription('Gérer les transactions XP')
    .addSubcommand(subcommand =>
      subcommand
        .setName('give')
        .setDescription('Donner des XP à un utilisateur')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('L\'utilisateur à qui donner des XP')
            .setRequired(true))
        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('Le montant d\'XP à donner')
            .setRequired(true))),

  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 