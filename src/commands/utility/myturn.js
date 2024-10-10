// This command will show all games for which it is the users turn

const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('myturn')
		.setDescription(`Lists all games in which it's the users turn.`),

	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command

		// Get the user ID
		const target = interaction.user;
		// Set the message header
		var updateMessage = `It's your turn in the following games:\n`;
		// Need to determine if it's NOT the users turn at all
		var noGame=true;

		for (let step = 0; step < myGames.length; step++) {
			// Debugging lines
			console.log('myGames[step].player:', myGames[step].player);
			console.log('target:', target.globalName);
			if (myGames[step].player == target.globalName) {
				// Found a game where it's the users turn
				updateMessage+=`- ` + myGames[step].game + `\n`;
				// Clear the noGame flag
				if (noGame) {noGame=false;}
			}
		}

		// If it's not the users turn at all, poke him a bit
		if (noGame) {
			updateMessage+=`Just kidding, it's not your turn at all.`;
		}

		await interaction.reply({
			content: updateMessage,
			ephemeral: true
		});
	},
}
	