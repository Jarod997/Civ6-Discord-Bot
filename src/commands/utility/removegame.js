// This command will delete one game from the stored current list -- used for when a game ends

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Removes a game from the current list.'),
		/*.addStringOption(option =>
			option.setName('gamelist')
				.setDescription('Game List')
				.setRequired(true)
				.addChoices(
					{ name: 'Funny', value:'gif_funny' },
					{ name: 'Meme', value: 'gif_meme' },
					{ name: 'Movie', value: 'gif_movie'	},
				)
		),*/

	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		// await interaction.reply({content: 'Pong!', components: [row], ephemeral: true });
		// console.log('answer:', interaction.options.getString('gamelist'));

		const target = interaction.options.getUser('target');
		const reason = interaction.options.getString('reason') ?? 'No reason provided';

		const confirm = new ButtonBuilder()
			.setCustomId('confirm')
			.setLabel('Confirm Ban')
			.setStyle(ButtonStyle.Danger);

		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder()
			.addComponents(cancel, confirm);

		await interaction.reply({
			content: `Are you sure you want to ban ${target} for reason: ${reason}?`,
			components: [row],
		});

		// Prompt for game name to remove, provide list of current games

		// Remove game from list

		// Delete the current list

		// Re-post the curent list

	},
}
	