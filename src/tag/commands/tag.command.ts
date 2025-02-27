import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Gérer les tags')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Créer un nouveau tag')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Le nom du tag')
            .setRequired(true))
        .addStringOption(option =>
          option
            .setName('content')
            .setDescription('Le contenu du tag')
            .setRequired(true))),

  async execute(interaction: any) {
    // La logique d'exécution sera implémentée ici
  }
}; 