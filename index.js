const { Client, Intents } = require('discord.js')
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require("ytdl-core");
const PlayDL = require('play-dl');

const player = createAudioPlayer();
const tts_player = createAudioPlayer();
const test = './second-of-silence.mp3'; //'https://www.youtube.com/watch?v=cdwal5Kw3Fc';
let resource = createAudioResource(test, {inlineVolume: true});


const client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});

const tts_client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});

//import {Cmd} from './commands.js';

//cmd = new Object;
// Program starts here. 
// ====================

const {token} = require('./config.json');
const {tts_token} = require('./config.json');

const config_settings = require('./config.json');
const CMD = require('./commands.js')
Cmd = new CMD(config_settings,player);
client.once('ready', ()=> {
	//Cmd['test']();
	let argv = process.argv; // Should this be global? 
	console.log(argv);
	COMMANDS = initialize_commands(!argv.includes('fast')); //! Use argc/argv here. 
	console.log('Ready!');
	console.log(get_timestamp('https://www.youtube.com/watch?v=LSCICFwlv8o'));
	console.log(get_timestamp('https://youtu.be/LSCICFwlv8o?t=1'));
	//!play_front(); // Why do we have this? 
		let fade_time = Cmd.FADE_TIME;
	setInterval( () => {
		if (Cmd.TALKING.size > 0) {
			Cmd.dropVolume();
			fade_time = Cmd.FADE_TIME;
			//console.log("Someone's talking!")
		}
		else {
			if (fade_time > 0)
				--fade_time; 
			Cmd.raiseVolume(fade_time);
		}
	},1);

});

function sigmoid (input) { // !!! 
	1 / (1 + 2.7182)
}


function kick() {
	resource = createAudioResource(test, {inlineVolume: true});
	//!player.play(resource);
} // Don't think that we still need this. 


client.on('interactionCreate', async interaction => {
try {
	if (!interaction.isCommand()) return; // Watch out. 
	// Is this deprecated? 
	
	if (Cmd.REQUIRE_ROLE_TO_USE && !interaction.member.roles.cache.some(r => r.name === Cmd.BOT_USERS)){
		respond(interaction,"You must have the "+BOT_USERS+" role to use the bot.");
		return;
	}

	const { commandName } = interaction;
	
	try {
		answer = await Cmd[commandName](interaction);
		console.log(answer);
		interaction.reply(answer);
	}
	catch (error) {
		try {
			respond(interaction,"Unknown error.");
			console.error(error);
		}
		finally {
			console.error("The expected error.");
		}
	}

} catch (e) {
	console.error(e);
	console.error("Error in command function.");
	}
});

function initialize_commands(initialize) {
	// Add another parameter to wipe all commands in the future, that'd be cool. 

		if (typeof initialize != 'boolean'){ // What the actual fuck is this language. 
			console.error('Function `initialize_commands()` was called with an invalid type.');
			return [];
		}

	const { SlashCommandBuilder } = require('@discordjs/builders');
	// Never mind, this language is fucking rad.  You can cause shit to happen in wacky orders by exploiting { } in a function that's being called asynchronously.  That's COOL. 

	const commands = [
		new SlashCommandBuilder().setName('help').setDescription('Lists all commands the bot can perform, and their descriptions.'),
		new SlashCommandBuilder().setName('play').setDescription('==> Immediately joins the channel you\'re in and plays the given song.\n').addStringOption(option => option.setName('url').setDescription('The song played.').setRequired(true)),
		new SlashCommandBuilder().setName('push').setDescription('Appends song to playlist.').addStringOption(option => option.setName('url').setDescription('The song appended.').setRequired(true)),
		new SlashCommandBuilder().setName('jump').setDescription('Prepends song to playlist.').addStringOption(option => option.setName('url').setDescription('The song prepended.').setRequired(true)),
		new SlashCommandBuilder().setName('insert').setDescription('Inserts a given song at a provided index.').addStringOption(opt=>opt.setName('url').setDescription('The song inserted.').setRequired(true)).addIntegerOption(opt=>opt.setName('index').setDescription('The index which the song will be inserted at.').setRequired(true)),
		new SlashCommandBuilder().setName('list').setDescription('Lists playlist.'),
		new SlashCommandBuilder().setName('history').setDescription('Responds with a history of all songs played.'),
		new SlashCommandBuilder().setName('skip').setDescription('Skips to the next song.'),
		new SlashCommandBuilder().setName('next').setDescription('Manually forces the next song to play.'),
		new SlashCommandBuilder().setName('stop').setDescription('Pauses song.'),
		new SlashCommandBuilder().setName('resume').setDescription('Resumes song.'),
		new SlashCommandBuilder().setName('strike').setDescription('Removes songs from the first index given until the second.').addIntegerOption(opt=>opt.setName('from').setDescription('The index of the song to be removed.').setRequired(true)).addIntegerOption(opt=>opt.setName('until').setDescription('The index of the last song to be removed.').setRequired(true)),
		new SlashCommandBuilder().setName('pop').setDescription('Removes the last song in the playlist.'),
		new SlashCommandBuilder().setName('auto').setDescription('Toggles autoplay feature.'),
		new SlashCommandBuilder().setName('loop').setDescription('Played songs are immediately appended to the end of the playlist.'),
		new SlashCommandBuilder().setName('keep').setDescription('Continually plays the current song.'),
		new SlashCommandBuilder().setName('set').setDescription('Sets the volume.').addNumberOption(option => option.setName('level').setDescription('The new volume level.').setRequired(true)),
		new SlashCommandBuilder().setName('damp').setDescription('Sets how much the volume is damped when people start talking, send 100 to functionally disable.').addNumberOption(option => option.setName('damp').setDescription('The new damping level.').setRequired(true)),
		new SlashCommandBuilder().setName('fade').setDescription('==> Sets the amount of time it takes to fade in; set low to functionally disable.').addIntegerOption(option => option.setName('fade').setDescription('The new fade level.').setRequired(true)),
		new SlashCommandBuilder().setName('join').setDescription('Joins the voice channel that you\'re in.'),
		new SlashCommandBuilder().setName('what').setDescription('Responds with currently playing song.'),
		new SlashCommandBuilder().setName('kick').setDescription('Sometimes fixes the bot.'),
		new SlashCommandBuilder().setName('test').setDescription('A test function, it should only be used by the developer.  REMOVE ME.').addStringOption(opt=>opt.setName('thisisjustfortesting').setDescription('Test.').setRequired(true)),
		// Use commas. 
	]
		.map(command => command.toJSON());

	// Add functionality to wipe commands.  // TAGYOUIT. 
	// if (wipe_commands) { /* do stuff */ } 
	if (initialize) 
	{
		const { REST } = require('@discordjs/rest');
		const { Routes } = require('discord-api-types/v9');
		const { clientId, guildId, token } = require('./config.json');
		const rest = new REST({version: '9' }).setToken(token);
		rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
			.then(() => console.log('Registration complete.'))
			.catch(console.error);
	}
	return commands;
}

// Utility functions. 
function capitalize(string){
	if (typeof string != 'string' || string.length < 1) {
		console.error("Error in `capitalize()`.")
		return string;
	}
	return string.charAt(0).toUpperCase().concat(string.slice(1));
}

// Should this be `async-await`ish? 
function affirm(conditional, error_msg, interaction){ // Bullying the macroless language into having macros. 
	if (conditional)
		return false;
	console.log("Affirm failed.");
	respond(interaction,error_msg);
	return true;
//	if (!conditional)
//		interaction.reply(error_msg);
//	console.log("Affirm returning",!conditional+'.');
//	return !conditional;
}

function remove_non_URL_characters(string){
	let legal_characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~:/?#[]@!$&'()*+;="; // , // Comma is deliberately excluded; is that prudent? 
	original_string = string;
	fnl = "";
	for (c of legal_characters)
		string = string.replaceAll(c,' ');
	for (let i=0;i<original_string.length;++i)
		fnl = fnl.concat(string.charAt(i) == ' '? original_string.charAt(i) : ' ');
	return fnl;
}

function respond(interaction,msg) {
	console.log(msg);
	interaction.reply(msg);
	return;
}

function get_timestamp(url) {
	return parseInt((/t=(\d+)/.exec(url)??[0,0])[1]);
	// Thanks, `The Great Old One of Javascript`. 
}


//player.on(AudioPlayerStatus.Idle, play_front()); // <===  // Thisthing.

player.on(AudioPlayerStatus.Idle, () => {
	Cmd.cycle();
});

client.login(token);

//const { clientId, guildId } = require('./config.json');
//const SweetPatch = client.guilds.cache.get(guildId)//.members.cache.get(clientId);
tts_client.login(tts_token);
tts_client.once('ready', ()=> {
	console.log('Amai, online!');

	setInterval( async () => { 
	},1);
});

tts_client.on('interactionCreate', async interaction => {
	//respond(interaction,'Disabled.');
	//return;
	const { commandName } = interaction;
	//interaction.applicationId = "983714302978568192" // Didn't work. 
	respond(interaction,"Application ID is "+interaction.applicationId);
	cmd.join(interaction);
	console.log("Type of ID is "+(typeof interaction.applicationId));
});
