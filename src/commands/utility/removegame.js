// This command will delete one game from the stored current list -- used for when a game ends

const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Removes a game from the current list.')
		.addStringOption(option =>
				option.setName('gamename')
					.setDescription('Remove which game?')
					.setRequired(true)
		),

	async execute(interaction) {

		const removeGame = interaction.options.getString('gamename');

		// Set a found flag
		var gameFound = false;
		// Check the list for the game
		for (let step = 0; step < myGames.length; step++) {
			if (myGames[step].game==removeGame) {
				// Found it
				gameFound=true;
				// Remove game from list
				myGames.splice(step, 1);
				// Don't parse the rest of the list
				return;
			}
		}

		// Set the reply message, if found or not
		if (gameFound) { replyMsg=removeGame & ` removed.`;	}
		else { replyMsg=`Game not found.`};

		// Post the reply
		await interaction.reply({
			content: replyMsg,
			ephemeral: true
		});

	},
}
	