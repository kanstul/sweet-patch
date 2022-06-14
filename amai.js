const { Client, Intents } = require('discord.js')
const {tts_token, clientId} = require('./safe.json');
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice'); // Comment this out later. 
const {respond} = require('./utility.js');

const DiscordTTS = require('discord-tts');

const tts_player = createAudioPlayer();
const tts_client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_MESSAGES
	],
});

tts_client.login(tts_token);

const {QUEUE_MESSAGES = false} = require('./config.json');

var PLAYING = false;

tts_client.once('ready', ()=> {
	console.log('Amai, online!');
	setInterval( () => {
		//console.log("Blink.");
		if ((!QUEUE_MESSAGES || !PLAYING) && queue[0] != undefined && queue[0].content != '') {
			PLAYING = true;
			console.log("Not undefined, now "+queue[0].content);
			try {
				if (queue[0].content.length <= 200)
					enunciate(queue[0].content);
				else
					enunciate("Message too long to read.");
			}
			catch (e){
				console.log(e);
			}
			finally {
				queue.shift();
			}
		}
	},1);
});

tts_client.on('interactionCreate', async interaction => {
	const { commandName } = interaction;
	respond(interaction,"Hello, world!");
});

const queue = [];

tts_client.on('messageCreate', async (/*ignore,*/msg) => {
	if (msg.content == 'URUSAI.')
		tts_player.stop();
	if (msg.content == "FORCE FOLLOW." || msg.content == "G-BEAT." || (msg.author.id == clientId/* && msg.content == "Joined."*/)) {
		console.log("If tripped.");
		let connection = getVoiceConnection(msg.guildId);
		connection = joinVoiceChannel({
			channelId: msg.member.voice.channelId,
			guildId: msg.guildId,
			adapterCreator: msg.guild.voiceAdapterCreator,
			selfDeaf: false,
			selfMute: false,
		});
		connection.subscribe(tts_player);
		//enunciate(msg.content);
		queue.push(msg);
	}
	/*
	console.log(queue.length);
	for (i of queue)
		console.log(i.content);
	*/
});

function enunciate(string) {
	console.log("Enunciate was called.");
	string = string.replaceAll('`','')
	/*
	while (string.length > 200){
		console.log("Attempting to stream "+string.slice(0,200));
		let stream = DiscordTTS.getVoiceStream(string.slice(0,200));
		let audioResource = createAudioResource(stream, {inlineVolume: true});
		tts_player.play(audioResource);
		string = string.slice(200);
	}
	*/
	let stream = DiscordTTS.getVoiceStream(string);
	let audioResource = createAudioResource(stream, {inlineVolume: true});
	tts_player.play(audioResource);
	return "Called the test function.";
}

tts_player.on(AudioPlayerStatus.Buffering, () => {
	console.log("Buffering.");
});

tts_player.on(AudioPlayerStatus.Idle, () => {
	console.log("Idle.");
	PLAYING = false;
	//SPEAKING = false;
	//if (queue.length > 0)
		//cmd.enunciate(queue[0]);
	//queue.shift(); // ^^? 
});
