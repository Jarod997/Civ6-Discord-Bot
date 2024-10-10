require('dotenv').config();
const { Events } = require('discord.js');

// Say hi to the log file when the bot wakes up
module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag} at ${Date().toString()}`);
        console.log(`✅ ${client.user.tag} - ${client.user.username} is online.`);
		// Post to the channel when the bot (last) started
		if (!inDevelopment) {
			const startupMessage = `✅ ${client.user.username} is online.`;
			client.channels.cache.get(process.env.CHANNELID).send(startupMessage);
		}
	},
};