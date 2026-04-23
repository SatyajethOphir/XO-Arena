const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createGame } = require('../games/tictactoe');
const gameManager = require('../sessions/gameManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xo')
    .setDescription('Play Tic Tac Toe')
    .addUserOption(option =>
      option.setName('opponent')
        .setDescription('Select opponent')
        .setRequired(true)
    ),

  async execute(interaction) {
    const opponent = interaction.options.getUser('opponent');

    if (opponent.bot || opponent.id === interaction.user.id) {
      return interaction.reply({ content: "❌ Invalid opponent", ephemeral: true });
    }

    const game = createGame(interaction.user.id, opponent.id);
    gameManager.create(interaction.channelId, game);

    const rows = [];

    for (let i = 0; i < 3; i++) {
      const row = new ActionRowBuilder();
      for (let j = 0; j < 3; j++) {
        const index = i * 3 + j;
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`xo_${index}`)
            .setLabel('⬜')
            .setStyle(ButtonStyle.Secondary)
        );
      }
      rows.push(row);
    }

    await interaction.reply({
      content: `🎮 Game Started!\n<@${game.players[0]}> (X) vs <@${game.players[1]}> (O)\nTurn: <@${game.players[0]}>`,
      components: rows
    });
  }
};