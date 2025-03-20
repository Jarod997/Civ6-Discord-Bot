// This command will show a scoreboard of all current games, sorted by game
// Game, Turn, Player, Timestamp

const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const gameSpace = 25;   // Padding after the game name
const turnSpace = 5;    // Padding after the turn number
const playerSpace = 17; // Padding after the player name
const timeSpace = 21;   // Padding after TURN SINCE title for timestamp

// Define month lookup
const mList = [
    `JAN`,`FEB`,`MAR`,`APR`,`MAY`,`JUN`,
    `JUL`,`AUG`,`SEP`,`OCT`,`NOV`,`DEC`
]

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scoreboard')
		.setDescription(`Posts a scoreboard of all the current games, sorted by game name.`),

	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command

		// Get the user ID
		const target = interaction.user;

        // Add the title
        updateMessage="*Current Civ 6 Scoreboard*\n";
        // Add header
        updateMessage+="`GAME"+` `.repeat(gameSpace-5)+"TURN"+` `.repeat(turnSpace-3);
        updateMessage+="PLAYER"+` `.repeat(playerSpace-6)+"TURN SINCE"+` `.repeat(timeSpace-10)+`\n`;
        // Add content
		for (let step = 0; step < myGames.length; step++) {
            // Add game, turn, and player
            updateMessage+=myGames[step].game + ` `.repeat(gameSpace-myGames[step].game.length);
            updateMessage+=myGames[step].turn + ` `.repeat(turnSpace-myGames[step].turn.length);
            updateMessage+=myGames[step].player + ` `.repeat(playerSpace-myGames[step].player.length);
            
            // Format the timestamp
            const date = new Date(myGames[step].timestamp);
            let datevalues = [
                date.getFullYear(),
                date.getMonth()+1,
                date.getDate(),
                date.getHours(),
                date.getMinutes(),
                date.getSeconds(),
            ];
            if (datevalues[2]<10) {datevalues[2]=`0`+datevalues[2];}
            if (datevalues[3]<10) {datevalues[3]=` `+datevalues[3];}
            if (datevalues[4]<10) {datevalues[4]=`0`+datevalues[4];}
            if (datevalues[5]<10) {datevalues[5]=`0`+datevalues[5];}
            // Add timestamp
            updateMessage+=datevalues[2]+`-`+mList[datevalues[1]]+`-`+datevalues[0]+`, `
            updateMessage+=datevalues[3]+`:`+datevalues[4]+`:`+datevalues[5]+`\n`;
		}
        // Close monospace formatting
        updateMessage+="`";

		await interaction.reply({
			content: updateMessage,
			ephemeral: true
		});
	},
}
	