require("dotenv").config();
const { Client, GatewayIntentBits, Collection, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const gameManager = require("./sessions/gameManager");
const { checkWinner, isDraw } = require("./games/tictactoe");

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// Load Commands
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    }
}

client.on(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Consolidated Interaction Handler
client.on(Events.InteractionCreate, async (interaction) => {
    // 1. Handle Slash Commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const payload = { content: "❌ Error executing command", ephemeral: true };
            if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
            else await interaction.reply(payload);
        }
    } 
    // 2. Handle Tic-Tac-Toe Buttons
    else if (interaction.isButton()) {
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
            return interaction.update({ content: `🏆 Winner: <@${interaction.user.id}>`, components: [] });
        }

        if (isDraw(game.board)) {
            game.active = false;
            gameManager.delete(interaction.channelId);
            return interaction.update({ content: "🤝 It's a draw!", components: [] });
        }

        game.turn = game.turn === 0 ? 1 : 0;

        // Rebuild board
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

        await interaction.update({ content: `Turn: <@${game.players[game.turn]}>`, components: rows });
    }
});

client.login(process.env.TOKEN);