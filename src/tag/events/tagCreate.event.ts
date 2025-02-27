import { Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: any) {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'tag') return;

    // La logique d'exécution sera implémentée ici
  }
}; 