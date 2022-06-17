const { Client, Intents } = require('discord.js')
const {guildId, tts_token, clientId} = require('./safe.json');
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice'); // Comment this out later. 
const {respond} = require('./utility.js');

const DiscordTTS = require('discord-tts');
const {PEDANTIC_AMAI = false} = require('./config.json');

const tts_player = createAudioPlayer();
const tts_client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_MESSAGES
	],
});

const name = "AMAI";

tts_client.login(tts_token);

const {QUEUE_MESSAGES = true} = require('./config.json');

var PLAYING = false;

const MAX_LENGTH = 180;

tts_client.once('ready', ()=> {
	console.log('Amai, online!');
	setInterval( () => {
		//console.log("Blink.");
		if ((!QUEUE_MESSAGES || !PLAYING) && queue[0] != undefined && queue[0].content != '') {
			console.log("Passed the `if` statement.");
			console.log("Not undefined, now "+queue[0].content);
			try {
				if (connection == null /* || Not connected to the same channel as Sweet. */) {
					const channelId = client.guilds.cache.get(guildId).members.cache.get(clientId).voice.channelId
					const adapterCreator = client.guilds.cache.get(guildId).voiceAdapterCreator;
					const guildId = guildId;
					connection = getVoiceConnection(msg.guildId);
					connection = joinVoiceChannel({
						channelId: channelId,
						guildId: guildId,
						adapterCreator: adapterCreator,
						selfDeaf: false,
						selfMute: false,
					});
					connection.subscribe(tts_player);
				}
				if (queue[0].content.length <= MAX_LENGTH) {
					enunciate(queue[0].content);
				}
				else
				{
					let tmp = queue[0].content.match(/.{1,MAX_LENGTH}/g);
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
	},1/*000*/);
});

tts_client.on('interactionCreate', async interaction => {
	const { commandName } = interaction;
	respond(interaction,"Hello, world!");
});

const queue = [];

connection = null;

tts_client.on('messageCreate', async (/*ignore,*/msg) => {
	if (msg.content == 'URUSAI.')
		tts_player.stop();
	else if (msg.content == 'MOTO URUSAI.')
		queue.splice(0,queue.length),tts_player.stop();
	else if (msg.content == "FORCE FOLLOW." || msg.content == "G-BEAT." || (msg.author.id == clientId/* && msg.content == "Joined."*/)) {
		console.log("If tripped.");
		console.log("If tripped.");
		connection = getVoiceConnection(msg.guildId);
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
	console.log("Enunciating "+string+'.');
	PLAYING = true;
	//console.log("Enunciate was called.");
	if (string.startsWith(name))
		string = "..Now playing.  ".concat(string.slice(name.length));
	else if (!PEDANTIC_AMAI){
		queue.shift();
		PLAYING = false;
		return; // !!!
	}
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

process.on('SIGINT', () => {
	if (connection != null)
		connection.destroy();
	console.log("\nExiting Amai.");
	process.exit(0);
});
