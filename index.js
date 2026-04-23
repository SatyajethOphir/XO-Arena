require("dotenv").config();

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const gameManager = require("./sessions/gameManager");
const { checkWinner, isDraw } = require("./games/tictactoe");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection(); // ✅ IMPORTANT

const commandFiles = fs.readdirSync("./commands");

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

client.once("ready", () => {
  console.log(`🔥 XO-Arena ready as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ Error executing command",
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: "❌ Error executing command",
        ephemeral: true
      });
    }
  }
});
client.login(process.env.TOKEN);
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const game = gameManager.get(interaction.channelId);
  if (!game || !game.active) return;

  const index = parseInt(interaction.customId.split('_')[1]);
  const currentPlayer = game.players[game.turn];

  if (interaction.user.id !== currentPlayer) {
    return interaction.reply({ content: "❌ Not your turn", ephemeral: true });
  }

  if (game.board[index]) return;

  game.board[index] = game.turn === 0 ? 'X' : 'O';

  const winner = checkWinner(game.board);

  if (winner) {
    game.active = false;
    gameManager.delete(interaction.channelId);

    return interaction.update({
      content: `🏆 Winner: <@${interaction.user.id}>`,
      components: []
    });
  }

  if (isDraw(game.board)) {
    game.active = false;
    gameManager.delete(interaction.channelId);

    return interaction.update({
      content: "🤝 It's a draw!",
      components: []
    });
  }

  game.turn = game.turn === 0 ? 1 : 0;

  // rebuild buttons
  const rows = [];
  for (let i = 0; i < 3; i++) {
    const row = new ActionRowBuilder();
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`xo_${idx}`)
          .setLabel(game.board[idx] || '⬜')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(!!game.board[idx])
      );
    }
    rows.push(row);
  }

  await interaction.update({
    content: `Turn: <@${game.players[game.turn]}>`,
    components: rows
  });
});