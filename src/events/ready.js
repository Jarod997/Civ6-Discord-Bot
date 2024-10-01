const { Events } = require('discord.js');

// Say hi to the log file when the bot wakes up
module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
        console.log(`✅ ${client.user.tag} - ${client.user.username} is online.`);
	},
};