const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

const commands = [
	new SlashCommandBuilder().setName('list').setDescription('Lists playlist.'),
	new SlashCommandBuilder().setName('skip').setDescription('Skips to the next song.'),
	new SlashCommandBuilder().setName('stop').setDescription('Pauses song.'),
	new SlashCommandBuilder().setName('play').setDescription('Resumes song.'),
	new SlashCommandBuilder().setName('kick').setDescription('Sometimes fixes the bot.'),
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Registration complete.'))
	.catch(console.error);

