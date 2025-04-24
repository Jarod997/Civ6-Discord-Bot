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
		console.log('removeGame:', removeGame);

		// Set a found flag
		var gameFound = false;
		// Check the list for the game
		for (let step = 0; step < myGames.length; step++) {
			console.log('Step ', step, 'myGames[step]:', myGames[step].game);
			// Added .toUpperCase() to remove case sensitivity
			if (myGames[step].game.toUpperCase()==removeGame.toUpperCase()) {
				// Found it
				gameFound=true;
				console.log('Found it!');
				// Remove game from list
				myGames.splice(step, 1);
				console.log('Spliced!');
				// Don't parse the rest of the list
				break;
			}
		}

		// Set the reply message, if found or not
		if (gameFound) { replyMsg=removeGame + ` removed.`;	}
		else { replyMsg=`Game not found.`};

		if (inDevelopment) {
			console.log(`* New myGames:`);
			for (let temp=0; temp<=(myGames.length-1); temp++) {
				console.log(`**`, myGames[temp].game);
			}
		}

		console.log(`\n`);

		// Post the reply
		await interaction.reply({
			content: replyMsg,
			ephemeral: true
		});


	},
}
	