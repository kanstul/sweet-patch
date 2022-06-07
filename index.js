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
var LOOP = false;
var LOOP_FRONT = false;

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
	else if (playlist.length < 10 && msg.content.startsWith(name+'jump `') && msg.content.endsWith('`.')) {
		playlist.unshift(msg.content.slice(name.length+6,-2));
		console.log('Unshifted '+msg.content.slice(name.length+6,-2));
	}
	else if (playlist.length < 10 && msg.content.startsWith(name+'push `') && msg.content.endsWith('`.')) {
		playlist.push(msg.content.slice(name.length+6,-2));
		console.log('Pushed '+msg.content.slice(name.length+6,-2));
	}
	else if (msg.content.startsWith(name+'show playlist.')) {
		console.log(playlist);
	}
	else if (msg.content.startsWith(name+'what\'s on the list?')) {
		response = [];
		//playlist.forEach(song => { ytdl.getInfo(song).then(info => {response.push(info.videoDetails.title); console.log(info.videoDetails.title);})}); // What a mess. 
		//for (song of playlist) 
		for (i=0;i<playlist.length;++i)
		{
			song = playlist[i];
			info = await ytdl.getInfo(song);
			response.push("".concat(i+1,". ",info.videoDetails.title,"\t[",new Date(info.videoDetails.lengthSeconds*1000).toISOString().substring(11,19),"]"));
		}
		console.log(response);
		console.log('Test.');
		if (response.length === 0)
			msg.reply("Nothing.");
		else
			msg.reply(response.join('\n'));
	}
	else if (msg.content.startsWith(name+'test.')) {
		//console.log(ytdl.getInfo('https://www.youtube.com/watch?v=vQHVGXdcqEQ', (info) => {console.log(info.videoDetails.title)}));
		ytdl.getInfo('https://www.youtube.com/watch?v=vQHVGXdcqEQ').then(info => {console.log(info.videoDetails.title)});
	}
	else if (msg.content === name+'loop.'){
		LOOP = true;
		LOOP_CURRENT = false; // Important. 
	}
	else if (msg.content === name+'loop off.'){
		LOOP = false;
	}
	else if (msg.content === name+'loop current.') {
		LOOP_CURRENT = true;
		LOOP = false; // Important. 
	}
	else if (msg.content === name+'loop current off.') {
		LOOP_CURRENT = false;
	}
});

player.on(AudioPlayerStatus.Idle, () => {
	try {
		if (playlist.length > 0){
			if (LOOP)
				playlist.push(playlist[0]);
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
