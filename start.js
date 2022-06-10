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
	new SlashCommandBuilder().setName('join').setDescription('Joins the voice channel that you\'re in.'),
	new SlashCommandBuilder().setName('what').setDescription('Responds with currently playing song.'),
	new SlashCommandBuilder().setName('set').setDescription('Sets the volume.').addNumberOption(option => option.setName('level').setDescription('The new volume level.').setRequired(true)),
	new SlashCommandBuilder().setName('push').setDescription('Appends song to playlist.').addStringOption(option => option.setName('song').setDescription('The song appended.').setRequired(true)),
	new SlashCommandBuilder().setName('jump').setDescription('Prepends song to playlist.').addStringOption(option => option.setName('song').setDescription('The song prepended.').setRequired(true)),
	new SlashCommandBuilder().setName('damp').setDescription('Sets how much the volume is damped when people start talking, send 100 to functionally disable.').addNumberOption(option => option.setName('damp').setDescription('The new damping level.').setRequired(true)),
	new SlashCommandBuilder().setName('history').setDescription('Responds with a history of all songs played.'),
	new SlashCommandBuilder().setName('auto').setDescription('Toggles autoplay feature.'),
	new SlashCommandBuilder().setName('next').setDescription('Manually forces the next song to play.'),
	new SlashCommandBuilder().setName('loop').setDescription('Continually plays the current song.'),
	new SlashCommandBuilder().setName('keep').setDescription('Played songs are immediately appended to the end of the playlist.'),
	// Use commas. 
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Registration complete.'))
	.catch(console.error);

