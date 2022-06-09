const { Client, Intents } = require('discord.js')
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { token } = require('./config.json');
const ytdl = require("ytdl-core");


const player = createAudioPlayer();
const test = './second-of-silence.mp3';
let resource = createAudioResource(test, {inlineVolume: true});

const name = "Muze, ";


const client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_BANS,
		Intents.FLAGS.GUILD_INTEGRATIONS,
		Intents.FLAGS.GUILD_WEBHOOKS,
		Intents.FLAGS.GUILD_INVITES,
		Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_PRESENCES,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_MESSAGE_TYPING,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
		Intents.FLAGS.DIRECT_MESSAGE_TYPING,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});

// Variables and such. 
var talking = new Set(); 
var playlist = [];
var LOOP = false;
var LOOP_FRONT = false;
var volume = 1.0;
var AUTO_PLAY = true;
var CURRENTLY_PLAYING = "Nothing played yet.";

client.once('ready', ()=> {
	//global.kick(); // Have to use global rather than window rather than eval. 
	console.log('Ready!');
	   player.play(resource); // <==
	setInterval( () => {
		if (talking.size > 0) {
			resource.volume.setVolume(0.1*volume);
		}
		else {
			resource.volume.setVolume(1.0*volume);
		}
	},1);
});

function kick() {
	resource = createAudioResource(test, {inlineVolume: true});
	player.play(resource);
}

async function list(response) {
	for (i=0;i<playlist.length;++i)
	{
		song = playlist[i];
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
		await list(response);

		if (response.length === 0)
			interaction.reply("Nothing.");
		else
			interaction.reply('\`\`\`'+response.join('\n')+'\`\`\`');
	}
	/*
	else if (commandName.startsWith(name+'set volume to `') && msg.content.endsWith('`.')) {
		old_volume = volume;
		volume = parseFloat(msg.content.slice(name.length+15,-2));
		volume = (!isNaN(volume))? volume : old_volume; 
	*/
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
			// Ended up not being necessary, bot doesn't register when it starts talking. 
			// Don't know why but not going to look a gift horse in the mouth for the moment. 
			// Should look into it at a future date though. 
			connection.receiver.speaking.on("start", (userId) => {
				console.log(`${userId} start`);
				talking.add(`${userId}`)
			});
			connection.receiver.speaking.on("end", (userId) => {
				console.log(`${userId} end`);
				talking.delete(`${userId}`)
			});
			interaction.reply('Joined.');
		} catch(error) {
			console.warn(error);
		}
	}
	else if (commandName == 'what'){
		interaction.reply(CURRENTLY_PLAYING);
	}
});


client.on('messageCreate', async msg => {
	console.log('A message was sent.');
	if (msg.author.bot || !msg.content.startsWith(name+''))
		return;
	if (msg.content === name+'test.'){
		msg.reply('Online.');
	}
	else if (msg.content === name+'can you follow me?'){
		var connection = getVoiceConnection(msg.guildId)
		if (true) {
			connection = joinVoiceChannel({
				channelId: msg.member.voice.channelId,
				guildId: msg.guildId,
				adapterCreator: msg.guild.voiceAdapterCreator,
				selfDeaf: false,
				selfMute: false,
			});
			   connection.subscribe(player); // <== 
		}
		try {
			await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
			// if ID == bot ID then return, or something. 
			// Ended up not being necessary, bot doesn't register when it starts talking. 
			// Don't know why but not going to look a gift horse in the mouth for the moment. 
			// Should look into it at a future date though. 
			connection.receiver.speaking.on("start", (userId) => {
				console.log(`${userId} start`);
				talking.add(`${userId}`)
			});
			connection.receiver.speaking.on("end", (userId) => {
				console.log(`${userId} end`);
				talking.delete(`${userId}`)
			});
			console.log('Looking good.');
		} catch(error) {
			console.warn(error);
		}
	}
	else if (msg.content === name+'kick.') {
		kick();
	}
	else if (msg.content === name+'skip.') {
		player.stop();
	}
	else if (msg.content === name+'stop.') {
		player.pause();
	}
	else if (msg.content === name+'play.') {
		player.unpause();
	}
	else if (playlist.length < 50 && msg.content.startsWith(name+'jump `') && msg.content.endsWith('`.')) {
		playlist.unshift(msg.content.slice(name.length+6,-2));
		console.log('Unshifted '+msg.content.slice(name.length+6,-2));
		if (AUTO_PLAY && playlist.size === 1)
			play_front();
	}
	else if (playlist.length < 50 && msg.content.startsWith(name+'push `') && msg.content.endsWith('`.')) {
		playlist.push(msg.content.slice(name.length+6,-2));
		console.log('Pushed '+msg.content.slice(name.length+6,-2));
		if (AUTO_PLAY && playlist.length === 1) 
			play_front();
	}
	else if (msg.content === (name+'show playlist.')) {
		console.log(playlist);
	}
	else if (msg.content === (name+'what\'s on the list?')) {
		response = [];
		await list(response);
		if (response.length === 0)
			msg.reply("Nothing.");
		else
			msg.reply('\`\`\`'+response.join('\n')+'\`\`\`');
	}
	else if (msg.content.startsWith(name+'test.')) {
		ytdl.getInfo('https://www.youtube.com/watch?v=vQHVGXdcqEQ').then(info => {console.log(info.videoDetails.title)});
	}
	else if (msg.content === name+'loop.'){
		LOOP = true;
		LOOP_FRONT = false; // Important. 
	}
	else if (msg.content === name+'loop off.'){
		LOOP = false;
	}
	else if (msg.content === name+'loop front.') {
		LOOP_FRONT = true;
		LOOP = false; // Important. 
	}
	else if (msg.content === name+'loop front off.') {
		LOOP_FRONT = false;
	}
	else if (msg.content === name+'what\'s the volume?') {
		msg.reply(""+volume);
	}
	else if (msg.content.startsWith(name+'set volume to `') && msg.content.endsWith('`.')) {
		old_volume = volume;
		volume = parseFloat(msg.content.slice(name.length+15,-2));
		volume = (!isNaN(volume))? volume : old_volume; 
	}
	else if (msg.content === name+'what\'s playing?') {
		// Could potentially be used to spam a chat by a user who is muted. 
		/*
		reponse = "Invalid song.";
		try {
			info = await ytdl.getInfo(CURRENTLY_PLAYING);
			response = ("".concat(i+1,". ",info.videoDetails.title,"\t[",new Date(info.videoDetails.lengthSeconds*1000).toISOString().substring(11,19),"]"));
		} catch (e) {
			console.error(e);
		}
		msg.reply(response);
		*/
		msg.reply(CURRENTLY_PLAYING);
		// Could potentially be used to spam a chat by a user who is muted. 
	}
});

player.on(AudioPlayerStatus.Idle, () => {
	play_front();
});

function play_front() {
	console.log('Play_front()');
	if (playlist.length > 0){
		if (LOOP)
			playlist.push(playlist[0]);
		console.log("Playlist[0] is: "+playlist[0]+".");
		song = null;
		try {
			song = ytdl(playlist[0]);
		}
		catch (e) {
			// None of this actually executes; why is that? 
			console.error(e);
			console.log('Bonk.');
			return;
		}
		resource = createAudioResource(song, {inlineVolume: true});
			// !!! 
			CURRENTLY_PLAYING = playlist[0]; // WATCH OUT: VARIABLE'S GLOBAL.  
			// SHOULD BE FINE SINCE IN ORDER TO GET HERE, MUST BE A YOUTUBE VIDEO. 
		console.log("We just created an audio resource of"+song+".");
		player.play(resource);
		if (!LOOP_FRONT)
			playlist.shift();
	}
}

client.login(token);

// TODO: Add song history. 
