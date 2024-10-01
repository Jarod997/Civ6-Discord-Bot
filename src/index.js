// Require the necessary discord.js classes
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

// Create array for game & turn info
const myGames = [];

// class for game data
class Games {
	constructor(game, player, turn) {
		this.game = game;
		this.player = player;
		this.turn = turn;
	}
}

// Create a new client instance
const client = new Client({ 
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});


// Create collections
client.commands = new Collection(); // For storing commands we've defined for the bot


// Dynamically retrieve event files
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Define text constants for lookups
const txtPlayer = `, it's`;
const txtGame = `Game: `;
const txtTurn = `Turn: `;
const txtEndTurn = `\nGame:`;

// Capture messageID of the previous summary post
var botPostID = "";

client.on("messageCreate", message => {
	//console.log(`Message as follows:`, message);

	// Log the message ID of the last summary post, to delete it when we post the new message
	if (message.author.bot && message.author.username === `Civ 6 Turn Compiler`) {
		if (message.content.includes(`PBC Game Summary`)) {
			botPostID=message.id;
		}
	}

	// Capture the Civ6 Turnbot post
	if (message.author.bot && message.author.username === `Civ6 Turnbot`) {
		if (message.content.includes(`, it's your turn.`)) {

			console.log(`Bot text found!`);
			const thisGame = new Games

			// Get the player ID, then convert to a text name -- DETECT NON LINK player names
			thisGame.player = message.content.substring(0, message.content.indexOf(txtPlayer));
			console.log(`Step 1: >${thisGame.player}<`);
			console.log(`Step 1a: >${thisGame.player.substring(0, 2)}<`);
			console.log(`Step 1b: >${thisGame.player.substring(0, 2) === '<@'}<`);
			if (thisGame.player.substring(0, 2) === '<@') {
				// Process a normal Discord link-type username - remove the leading `<@` and trailing `>`
				thisGame.player=thisGame.player.substring(2, (thisGame.player.length - 1));
				console.log(`Step 2: >${thisGame.player}<`);
				// Use the ID (long number) to fetch...
				const user = client.users.cache.find((user) => user.id === thisGame.player);
				// ...and return a plain text username
				thisGame.player = user.displayName;
				console.log(`Step 3: >${thisGame.player}<`);
			}
			
			// Get the game name and turn number
			thisGame.game = message.content.substring(message.content.indexOf(txtGame)+txtGame.length);
			thisGame.turn = message.content.substring(message.content.indexOf(txtTurn)+txtTurn.length, message.content.indexOf(txtEndTurn));
			// Log it to make sure things are working
			console.log(`botPlayer: >${thisGame.player}<`);
			console.log(`botGame: >${thisGame.game}<`);
			console.log(`botTurn: >${thisGame.turn}<`);

			// If the game exists, update it - otherwise add it to the set
			if (myGames.length==0) {
				// Add the first array item if it's empty
				myGames.push(thisGame);
			}
			else {
				// Check to see if the game exists then update it
				var newGame = true;
				for (let step = 0; step < myGames.length; step++) {
					if (myGames[step].game  == thisGame.game) {
						myGames[step].player = thisGame.player;
						myGames[step].turn = thisGame.turn;
						newGame = false;
					}
				}
				// ... otherwise, add it
				if (newGame) { myGames.push(thisGame); }
			}

			// Display the games summary
			var updateMessage = "**PBC Game Summary**\n";
			console.log(`Size: ${myGames.length}`);
			for (let step = 0; step < myGames.length; step++) {
				console.log(myGames[step]);
				updateMessage += "*" + myGames[step].game + "*, Turn " + myGames[step].turn + " - " + myGames[step].player + "\n"
			}

			// If the bot HAS posted, then delete the previous post...
			if (botPostID != "") { client.channels.cache.get(process.env.CHANNELID).messages.fetch(botPostID).then(message => message.delete()); }
			// (...then) post the update.
			client.channels.cache.get(process.env.CHANNELID).send(updateMessage);

			// Will have to deal with a bot restart with an existing summary post somehow.
		}
	}
})

client.login(process.env.TOKEN);