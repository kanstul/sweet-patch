const { Client, Intents } = require('discord.js')
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { token } = require('./config.json');
const ytdl = require("ytdl-core");


const player = createAudioPlayer();
const test = ytdl('https://www.youtube.com/watch?v=a51VH9BYzZA');
//const resource = createAudioResource('/home/ask/code/bot/audio.mp3', {inlineVolume: true});
//const resource = createAudioResource(test, {inlineVolume: true});
let resource = createAudioResource(test, {inlineVolume: true});


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
var playlist = []

client.once('ready',()=> {
	console.log('Ready!');
	setInterval( () => {
		if (talking.size > 0)
			resource.volume.setVolume(0.1);
		else
			resource.volume.setVolume(1.0);
	},1);
});


client.on('messageCreate', async msg => {
	console.log('A message was sent.');
	if (msg.author.bot || !msg.content.startsWith('Muse, '))
		return;
	if (msg.content === 'Muse, can you follow me?'){
		var connection = getVoiceConnection(msg.guildId)
		if (true) {
			connection = joinVoiceChannel({
				channelId: msg.member.voice.channelId,
				guildId: msg.guildId,
				adapterCreator: msg.guild.voiceAdapterCreator,
				selfDeaf: false,
				selfMute: false,
			});

			console.log('HACK');
			connection.subscribe(player);

		}
		try {
			await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
			// if ID == bot ID then return, or something. 
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
	else if (msg.content === 'Muse, is anyone talking?') {
		if (talking.size === 0) // Alternatively, could just check if greater than one over here. 
			console.log("No.")
		else
			console.log("Yes.")
	}
	else if (msg.content === 'Muse, play the test song.') {
		console.log('Playing.');
		player.play(resource);
		console.log('Played.');
	}
	else if (msg.content === 'Muse, reduce the volume.') {
		resource.volume.setVolume(0.1);
	}
	else if (msg.content === 'Muse, raise the volume.') {
		resource.volume.setVolume(1.0);
	}
	else if (msg.content === 'Muse, stop playing.') {
		player.stop();
	}
	else if (msg.content === 'Muse, delete this command later.') {
		playlist.push('https://www.youtube.com/watch?v=wU10eqcK5AM');
		//playlist.push(test);
		console.log(playlist.length);
	}
	else if (msg.content.startsWith('Muse, push `') && msg.content.endsWith('`.')) {
		playlist.push(msg.content.slice(12,-2));
		console.log('Pushed '+msg.content.slice(12,-2));
	}
});

player.on(AudioPlayerStatus.Idle, () => {
	if (playlist.length > 0){
		console.log("Playlist[0] is: "+playlist[0]+".");
		resource = createAudioResource(ytdl(playlist[0]), {inlineVolume: true});
		player.play(resource);
		playlist.shift();
	}

});

client.login(token);
