// Require the necessary discord.js classes
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

// *** Constants ***
// Define text constants for lookups
const txtPlayer = `, it's`;
const txtGame = `Game: `;
const txtTurn = `Turn: `;
const txtEndTurn = `\nGame:`;

// *** Globals ***
// Variable to disable certain items when frequent restarts are going to happen
global.inDevelopment = false;
// Create array for game & turn info
global.myGames = [];
// Create array to hold a jobs list - used to prevent crashes from (near) concurrent update posts
global.jobQueue = [];

// class for game data
class Games {
	constructor(game, player, turn, timestamp) {
		this.game = game;
		this.player = player;
		this.turn = turn;
		this.timestamp = timestamp;
	}
	blank() {
		this.game=null;
		this.player=null;
		this.turn=null;
		this.timestamp=null;
		return(this);
	}
}


// ***** System level proceedures *****

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

// ***** User level proceedures *****

// Create listener for new messages
client.on("messageCreate", message => {

	// Capture the Civ6 Turnbot post
	if (message.author.bot && message.author.username === `Civ6 Turnbot`) {
		if (message.content.includes(`, it's your turn.`)) {

			let thisGame=new Games;

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
			// Get the game name, turn number, and timestamp
			thisGame.game = message.content.substring(message.content.indexOf(txtGame)+txtGame.length);
			thisGame.turn = message.content.substring(message.content.indexOf(txtTurn)+txtTurn.length, message.content.indexOf(txtEndTurn));
			thisGame.timestamp = message.createdTimestamp;

			// Add a job to the work queue
			jobQueue.push(thisGame);

			console.log(`>>> Bot text found:`, thisGame);
			if (inDevelopment) {
				console.log(`* Pre-process:`);
				console.log(`** thisGame:`, thisGame);
				console.log(`** myGames:`);
				for (let step=0; step<myGames.length; step++) {
					console.log(myGames[step]);
				}
			}

			// If the game exists, update it - otherwise add it to the set
			if (myGames.length==0) {
				// Add the first array item if it's empty
				console.log(`- Adding first game to list.`);
				myGames.push(thisGame);
			}
			else {
				// Check to see if the game exists then update it
				var newGame = true;
				for (let step = 0; step < myGames.length; step++) {
					if (myGames[step].game  == thisGame.game) {
						console.log(`- Game found, updating data.`);
						myGames[step].player = thisGame.player;
						myGames[step].turn = thisGame.turn;
						myGames[step].timestamp = thisGame.timestamp;
						newGame = false;
					}
				}
				// ... otherwise, add it
				if (newGame) {
					console.log(`- Game not found, adding to list.`);
					myGames.push(thisGame);
					// ... and Sort by game -- bubble sort, small list
					if (myGames.length>1) {
						sortGames();
						console.log(`-- List sorted.`);
					}
				}
			}
			
			if (inDevelopment) {
				console.log(`* Post-process:`);
				console.log(`** thisGame:`, thisGame);
				console.log(`** myGames:`);
				for (let step=0; step<myGames.length; step++) {
					console.log(myGames[step]);
				}
			}

			// If at this point there's more than one job in the work queue, delete one job and just skip posting the update, we'll catch it on the next round.
			if (inDevelopment) {console.log(`Job Queue, prior to calling postSummary: `, jobQueue.length);}
			if (jobQueue.length >= 2) {
				console.log(`** Work queue backed up, skipping post:`, jobQueue.length, `\n`);
				jobQueue.shift();
			} else {
				postSummary(thisGame.game);
				console.log(`Updated at:`, getTime(thisGame.timestamp));
			}
			if (inDevelopment) {console.log(`Job Queue, after postSummary:`, jobQueue.length);}
		}
	}
})

client.login(process.env.TOKEN);

client.on("ready", () => {
	runBotStartup();
});

// Function to get the latest bot post and ID
async function runBotStartup() {

	console.log(`>>> Bot Startup start:`);

	const OutputChannel = client.channels.cache.get(process.env.SummaryChannelID);
	const InputChannel = client.channels.cache.get(process.env.UpdatesChannelID);
	console.log(`- Fetch summary bot messages.`);
	const summaryMessages = await OutputChannel.messages.fetch({ limit: 10});
	console.log(`- Fetch update bot messages.`);
	const updateMessages = await InputChannel.messages.fetch({ limit: 100});

	var lastPost = "";
	var botPostID = "";

	// Read the Summary channel for any previous posts
	console.log(`- Reading summary messages...`);
	summaryMessages.forEach(message => {
		if (inDevelopment) { console.log(`** Post:`, message.content); }
		if (message.content.includes(`PBC Game Summary`)) {
			lastPost=message.content.trim().replaceAll("*", "");
			botPostID=message.id;
			console.log(`-- Found post:`, botPostID);
		}
	});
	if (botPostID=="") { console.log(`-- No previous post found!`); }

	// If a previous post exists, read it into memory
	if (botPostID!="") {
		console.log(`- Loading previous post.`);
		const postArr = lastPost.split("\n");
		let thisGame=new Games;
		for (let loopVar=0; loopVar<postArr.length; loopVar++) {
			if (postArr[loopVar].includes(`, Turn `)) {
				thisGame.game=postArr[loopVar].substring(0,postArr[loopVar].indexOf(`,`));
				thisGame.turn=postArr[loopVar].substring(postArr[loopVar].indexOf(`,`)+7, postArr[loopVar].indexOf(`- `)-1);
				thisGame.player=postArr[loopVar].substring(postArr[loopVar].indexOf(`- `)+2,);
				thisGame.timestamp=1;
				myGames.push(thisGame);
				thisGame=new Games;
			}
		}

		if (inDevelopment) {
			console.log('* Post-load post:');
			for (let step = 0; step < myGames.length; step++) {
				console.log(myGames[step]);
			}
		}
	}

	// Update last post with the data from the last number of update bot posts
	console.log(`- Reading update messages...`);
	updateMessages.forEach(message => {
		var found=false;
		var thisGame=new Games;
		if (message.author.bot && message.author.username === `Civ6 Turnbot`) {
			// See main update loop for comments on the following section
			thisGame.player = message.content.substring(0, message.content.indexOf(txtPlayer));
			if (thisGame.player.substring(0, 2) === '<@') {
				thisGame.player=thisGame.player.substring(2, (thisGame.player.length - 1));
				const user = client.users.cache.find((user) => user.id === thisGame.player);
				thisGame.player = user.displayName;
			}
			thisGame.game = message.content.substring(message.content.indexOf(txtGame)+txtGame.length);
			thisGame.turn = message.content.substring(message.content.indexOf(txtTurn)+txtTurn.length, message.content.indexOf(txtEndTurn));
			thisGame.timestamp = message.createdTimestamp;

			// Compare and update existing data
			found=false;
			for (let step = 0; step < myGames.length; step++) {
				if (myGames[step].game==thisGame.game) {
					if (thisGame.timestamp>myGames[step].timestamp) {
						console.log(`-- Updating`, thisGame.game);
						myGames[step] = thisGame;
					}
					found=true;
					break;
				}
			}
			// Add non-existing game
			if (!found) {
				console.log(`-- Adding`, thisGame.game);
				myGames.push(thisGame);
			}
		}
	});

	if (jobQueue.length != 0) {
		console.log(`- Job Queue not empty, clearing.`);
		if (inDevelopment) {console.log(`>>>> Pre-clear jobQueue length: `, jobQueue.length);}
		for (a=0; a<=jobQueue.length-1; a++) {
			if (inDevelopment) {console.log(`>>>>> Pop count`, a);}
			jobQueue.pop();
		}
	} else {
		console.log(`- Job Queue empty.`);
		if (inDevelopment) {console.log(`>>>> Job Queue length:`, jobQueue.length);}
	}

	sortGames();

	console.log('- Current data:');
	if (inDevelopment) {console.log(`myGames.length:`, myGames.length);}
	for (let step = 0; step < myGames.length; step++) {
		console.log(myGames[step]);
	}

	postSummary("Server Rebooted");
	console.log(`Starup complete, waiting for updates.`);
}

function sortGames() {
	if (inDevelopment) {console.log(`>>> Sort games start.`);}
	let tempGame =  new Games;
	for (let numA=0; numA < (myGames.length-1); numA++) {
		for (let numB=(numA+1); numB <= (myGames.length-1); numB++) {
			if (myGames[numA].game > myGames[numB].game) {
				tempGame=myGames[numB];
				myGames[numB]=myGames[numA];
				myGames[numA]=tempGame;
			}
		}
	}
}

async function postSummary(lastUpdatedGame) {

	console.log(`>>> Post Summary start:`);
	
	const OutputChannel = client.channels.cache.get(process.env.SummaryChannelID);
	console.log(`- Fetch summary bot messages.`);
	const summaryMessages = await OutputChannel.messages.fetch({ limit: 10});

	var lastPost = "";
	var botPostID = "";

	// Read up to the last 10 messages in the Summary channel, looking for a Summary post
	console.log(`- Reading summary messages...`);
	summaryMessages.forEach(message => {
		if (message.content.includes(`PBC Game Summary`)) {
			lastPost=message.content.trim().replaceAll("*", "");
			botPostID=message.id;
			console.log(`-- Found post:`, botPostID);
		}
	});
	if (botPostID=="") { console.log(`-- No previous post found!`); }

	// Display the games summary
	console.log(`- Building summary post...`);
	var updateMessage = "**PBC Game Summary**\n";
	if (inDevelopment) { console.log(`** luG:`, lastUpdatedGame); }
	if (lastUpdatedGame=="Server Rebooted") {
		updateMessage="*Server Rebooted*\n**PBC Game Summary**\n";
	}
	for (let step = 0; step < myGames.length; step++) {
		updateMessage += "*" + myGames[step].game + "*, Turn " + myGames[step].turn + " - " + myGames[step].player
		// Add a marker to show which game was last updated
		if (lastUpdatedGame==myGames[step].game) {
			updateMessage += " *\n";
		}
		else {
			updateMessage += "\n";
		}
	}

	// If the bot HAS posted, then delete the previous post.
	if (botPostID!="") { 
		console.log(`- Deleting previous post.`);
		client.channels.cache.get(process.env.SummaryChannelID).messages.fetch(botPostID).then(message => message.delete());
	}
	// Post the update.
	client.channels.cache.get(process.env.SummaryChannelID).send(updateMessage);

	// Remove the current job in the list.
	jobQueue.shift();
	console.log(`- Update posted, Job Queue:`, jobQueue.length, `\n`);
}

function getTime(timestamp) {
// Takes a Discord timecode and returns a formatted date/time string

	// Define month words
	var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
	// Not currently used, but here just in case.
	var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

	var dateString; // The return value
	// Grab the time code, turn it into a date
	var date = new Date(timestamp);

	// Break it into components
	const d = {
		year: date.getFullYear(),
		month: months[date.getMonth()],
		day: date.getDate(),
		hours: date.getHours(),
		minutes: date.getMinutes(),
		seconds: date.getSeconds()
	};

	// Build the date string
	dateString=``;
	if (d.day<10) {dateString=`0`;}
	dateString+=d.day + `-` + d.month + `-` + d.year + `, `;
	dateString+=d.hours + `:`;
	if (d.minutes<10) {dateString+=`0`;}
	dateString+=d.minutes + `:`;
	if (d.seconds<10) {dateString+=`0`;}
	dateString+=d.seconds;

	return dateString;
}
