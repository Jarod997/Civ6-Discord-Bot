// Used to delete slash commands

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const rest = new REST().setToken(process.env.TOKEN);

// *** Manually set the command to delete ***
const commandId = '1284606094408159323';

// for guild-based commands
rest.delete(Routes.applicationGuildCommand(process.env.CLIENTID, process.env.GUILDID, commandId))
	.then(() => console.log('Successfully deleted guild command'))
	.catch(console.error);

// for global commands
rest.delete(Routes.applicationCommand(process.env.CLIENTID, commandId))
	.then(() => console.log('Successfully deleted application command'))
	.catch(console.error);
