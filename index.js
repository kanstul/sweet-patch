const { Client, Intents } = require('discord.js')
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { token } = require('./config.json');
const ytdl = require("ytdl-core");


const player = createAudioPlayer();
const test = './second-of-silence.mp3';
let resource = createAudioResource(test, {inlineVolume: true});

//const name = "Muze, ";


const client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		//Intents.FLAGS.GUILD_BANS,
		//Intents.FLAGS.GUILD_INTEGRATIONS,
		//Intents.FLAGS.GUILD_WEBHOOKS,
		//Intents.FLAGS.GUILD_INVITES,
		Intents.FLAGS.GUILD_VOICE_STATES,
		//Intents.FLAGS.GUILD_PRESENCES,
		//Intents.FLAGS.GUILD_MESSAGES,
		//Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		//Intents.FLAGS.GUILD_MESSAGE_TYPING,
		//Intents.FLAGS.DIRECT_MESSAGES,
		//Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
		//Intents.FLAGS.DIRECT_MESSAGE_TYPING,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});

// Variables and such. 
var TALKING = new Set(); 
var PLAYLIST = [];
var LOOP = false;
var LOOP_FRONT = false;
var volume = 1.0;
var AUTO_PLAY = true;
var CURRENTLY_PLAYING = "Nothing played yet.";
var DAMP = 0.1;
var HISTORY = [];
var MAX_HISTORY_SIZE = 100;

client.once('ready', ()=> {
	//global.kick(); // Have to use global rather than window rather than eval. 
	console.log('Ready!');
	   player.play(resource); // <==
	setInterval( () => {
		if (TALKING.size > 0) {
			resource.volume.setVolume(DAMP*volume);
		}
		else {
			resource.volume.setVolume(volume);
		}
	},1);
});

function kick() {
	resource = createAudioResource(test, {inlineVolume: true});
	player.play(resource);
}

async function list(response,list_given) {
	for (i=0;i<list_given.length;++i)
	{
		song = list_given[i];
		try {
			info = await ytdl.getInfo(song);
			response.push("".concat(i+1,". ",info.videoDetails.title,"\t[",new Date(info.videoDetails.lengthSeconds*1000).toISOString().substring(11,19),"]"));
		} catch (e) {
			// This isn't tripping for some reason, I don't know why. 
			console.error(e);
			response.push('Invalid song.');
		}
	}
	return response;
}

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;
	
	if (commandName === 'list') {
		response = [];
		await list(response,PLAYLIST);

		if (response.length === 0)
			interaction.reply("Nothing.");
		else
			interaction.reply('\`\`\`'+response.join('\n')+'\`\`\`');
	}
	else if (commandName === 'kick') {
		kick();
		interaction.reply('\`*Rattle*\`');
	}
	else if (commandName === 'skip') {
		player.stop();
		interaction.reply('Skipping.');
	}
	else if (commandName === 'stop') {
		player.pause();
		interaction.reply('Paused.');
	}
	else if (commandName === 'play') {
		player.unpause();
		interaction.reply('Resumed.');
	}
	else if (commandName === 'join'){
		var connection = getVoiceConnection(interaction.guildId)
		if (true) {
			connection = joinVoiceChannel({
				channelId: interaction.member.voice.channelId,
				guildId: interaction.guildId,
				adapterCreator: interaction.guild.voiceAdapterCreator,
				selfDeaf: false,
				selfMute: false,
			});
			   connection.subscribe(player); // <== 
		}
		try {
			await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
			// if ID == bot ID then return, or something. 
			// Ended up not being necessary, bot doesn't register when it starts TALKING. 
			// Don't know why but not going to look a gift horse in the mouth for the moment. 
			// Should look into it at a future date though. 
			connection.receiver.speaking.on("start", (userId) => {
				console.log(`${userId} start`);
				TALKING.add(`${userId}`)
			});
			connection.receiver.speaking.on("end", (userId) => {
				console.log(`${userId} end`);
				TALKING.delete(`${userId}`)
			});
			interaction.reply('Joined.');
		} catch(error) {
			console.warn(error);
		}
	}
	else if (commandName === 'what'){
		interaction.reply(CURRENTLY_PLAYING);
	}
	else if (commandName === 'set'){
		response = 'Volume was \`'+volume+'\`, is '
		volume = interaction.options.getNumber('level') / 10.0;
		response = response.concat('now \`'+volume+'\`.');
		interaction.reply(response);
	}
	else if (commandName === 'push'){
		console.log(interaction.options.getString('song'));
		PLAYLIST.push(interaction.options.getString('song'));
		if (AUTO_PLAY && PLAYLIST.size === 1)
			play_front();
	}
	else if (commandName === 'jump'){
		PLAYLIST.unshift(interaction.options.getString('song'));
		if (AUTO_PLAY && PLAYLIST.size === 1)
			play_front();
	}
	else if (commandName === 'damp'){
		response = 'Volume was \`'+DAMP+'\`, is '
		DAMP = interaction.options.getNumber('damp') / 100.0; // Is 100 appropriate? 
		// Could use DAMP = Math.max(DAMP, interaction.opt..., but this is more fun! 
		response = response.concat('now \`'+DAMP+'\`.');
		interaction.reply(response);
	}
	else if (commandName === 'history'){
		response = [];
		await list(response,HISTORY);
		if (response.length === 0)
			interaction.reply("No songs have been played.");
		else
			interaction.reply('\`\`\`'+response.join('\n')+'\`\`\`');
	}
});


player.on(AudioPlayerStatus.Idle, () => {
	play_front();
});

function play_front() {
	console.log('Play_front()');
	if (PLAYLIST.length > 0){
		if (LOOP)
			PLAYLIST.push(PLAYLIST[0]);
		console.log("Playlist[0] is: "+PLAYLIST[0]+".");
		song = null;
		try {
			song = ytdl(PLAYLIST[0]);
		}
		catch (e) {
			// None of this actually executes; why is that? 
			console.error(e);
			console.log('Bonk.');
			return;
		}
		resource = createAudioResource(song, {inlineVolume: true});
			// !!! 
			CURRENTLY_PLAYING = PLAYLIST[0]; // WATCH OUT: VARIABLE'S GLOBAL.  
			// SHOULD BE FINE SINCE IN ORDER TO GET HERE, MUST BE A YOUTUBE VIDEO. 
		console.log("We just created an audio resource of"+song+".");
		player.play(resource);
		if (!LOOP_FRONT) {
			HISTORY.unshift(PLAYLIST[0]); // Use CURRENTLY_PLAYING instead? 
			if (HISTORY.length > MAX_HISTORY_SIZE)
				HISTORY.pop();
			PLAYLIST.shift();
		}
	}
}

client.login(token);
