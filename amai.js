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

const {QUEUE_MESSAGES = true} = require('./config.json');

var PLAYING = false;

tts_client.once('ready', ()=> {
	console.log('Amai, online!');
	setInterval( () => {
		//console.log("Blink.");
		if ((!QUEUE_MESSAGES || !PLAYING) && queue[0] != undefined && queue[0].content != '') {
			console.log("Passed the `if` statement.");
			console.log("Not undefined, now "+queue[0].content);
			try {
				if (queue[0].content.length <= 200) {
					enunciate(queue[0].content);
				}
				else
				{
					let tmp = queue[0].content.match(/.{1,200}/g);
					queue.shift();
					for (let i = tmp.length-1; i>= 0; --i) {
						let hack = new Object();
						hack.content = tmp[i];
						queue.unshift(hack);
					}
				}
			}
			catch (e){
				console.log(e);
			}
		}
		//console.log(queue);
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
	else if (msg.content == 'MOTO URUSAI.')
		queue.splice(0,queue.length),tts_player.stop();
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
		//console.log(queue);
	}
});

function enunciate(string) {
	PLAYING = true;
	//console.log("Enunciate was called.");
	string = string.replaceAll('`','')
	let stream = DiscordTTS.getVoiceStream(string);
	let audioResource = createAudioResource(stream, {inlineVolume: true});
	tts_player.play(audioResource);
	//PLAYING = false;
	//console.log("Exiting enunciate.");
	return "Called the test function.";
}

tts_player.on(AudioPlayerStatus.Buffering, () => {
	console.log("Buffering.");
});

tts_player.on(AudioPlayerStatus.Idle, () => {
	console.log("Idle.");
	PLAYING = false;
	queue.shift();
});
