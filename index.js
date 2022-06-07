const { Client, Intents } = require('discord.js')
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { token } = require('./config.json');
const ytdl = require("ytdl-core");


const player = createAudioPlayer();
const test = './second-of-silence.mp3';
let resource = createAudioResource(test, {inlineVolume: true});

const name = "Sp, ";


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

client.once('ready',()=> {
	console.log('Ready!');
	   player.play(resource); // <==
	setInterval( () => {
		if (talking.size > 0) {
			resource.volume.setVolume(0.1);
		}
		else {
			resource.volume.setVolume(1.0);
		}
	},1);
});

function kick() {
	resource = createAudioResource(test, {inlineVolume: true});
	player.play(resource);
}

client.on('messageCreate', async msg => {
	console.log('A message was sent.');
	if (msg.author.bot || !msg.content.startsWith(name+''))
		return;
	if (msg.content === name+'can you follow me?'){
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
	/*
	else if (msg.content === name+'play.') {
		if (playlist.length > 0) {
			resource = createAudioResource(ytdl(playlist[0]), {inlineVolume: true});
			player.play(resource);
			playlist.shift();
		}
		else {
			msg.reply("Can not play, nothing in the playlist.");
		}
	}
	*/
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
	else if (msg.content.startsWith(name+'jump `') && msg.content.endsWith('`.')) {
		playlist.unshift(msg.content.slice(name.length+6,-2));
		console.log('Unshifted '+msg.content.slice(name.length+6,-2));
	}
	else if (msg.content.startsWith(name+'push `') && msg.content.endsWith('`.')) {
		playlist.push(msg.content.slice(name.length+6,-2));
		console.log('Pushed '+msg.content.slice(name.length+6,-2));
	}
	else if (msg.content.startsWith(name+'show playlist.')) {
		console.log(playlist);
	}
});

player.on(AudioPlayerStatus.Idle, () => {
	try {
		if (playlist.length > 0){
			console.log("Playlist[0] is: "+playlist[0]+".");
			resource = createAudioResource(ytdl(playlist[0]), {inlineVolume: true});
			player.play(resource);
			playlist.shift();
		}
	}
	catch (error) {
		console.log("The error was CAUGHT!");
	} // Why isn't this working? 
});

client.login(token);
