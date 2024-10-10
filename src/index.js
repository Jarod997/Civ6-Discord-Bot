// Require the necessary discord.js classes
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

// Variable to disable certain items when frequent restarts are going to happen
global.inDevelopment = true;

// Create array for game & turn info
global.myGames = [];

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

// Dynamically retrieve all command files
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Create listener for slash commands
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});


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

// Create listener for new messages
client.on("messageCreate", message => {

	// Log the message ID of the last summary post, to delete it when we post the new message
	if (message.author.bot) {
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
			if (thisGame.player.substring(0, 2) === '<@') {
				// Process a normal Discord link-type username - remove the leading `<@` and trailing `>`
				thisGame.player=thisGame.player.substring(2, (thisGame.player.length - 1));
				// Use the ID (long number) to fetch...
				const user = client.users.cache.find((user) => user.id === thisGame.player);
				// ...and return a plain text username
				thisGame.player = user.displayName;
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