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

const settings = require("./config.json");
const command = require('./commands.js');

cmd = new command(settings,tts_player);

tts_client.once('ready', ()=> {
	console.log('Amai, online!');
});

tts_client.on('interactionCreate', async interaction => {
	const { commandName } = interaction;
	respond(interaction,"Hello, world!");
});

msg_queue = [];

SPEAKING = false;

tts_client.on('messageCreate', async msg => {
	//console.log("Amai perceived a message, it said `"+msg.content+"`, and its author's ID was `"+msg.author.id+"`.");
	//console.log("We were looking for `"+clientId+"`.");

	if (msg.content == "FORCE FOLLOW." || (msg.author.id == clientId && msg.content == "Joined.")) {
		//cmd.join(msg);
		//msg.channel.send("Hey.");
		let connection = getVoiceConnection(msg.guildId);
		connection = joinVoiceChannel({
			channelId: msg.member.voice.channelId,
			guildId: msg.guildId,
			adapterCreator: msg.guild.voiceAdapterCreator,
			selfDeaf: false,
			selfMute: false,
		});
		connection.subscribe(tts_player);
	}
	cmd.read(msg.content);
	console.log(msg_queue);
	//console.log(enunciate(msg.content));
});

//=====
function read(string) {
	let stream = DiscordTTS.getVoiceStream(string);
	let audioResource = createAudioResource(stream, {inlineVolume: true});
	tts_player.play(audioResource);
	return "Called the test function.";
}
//=====

tts_player.on(AudioPlayerStatus.Buffering, () => {
	console.log("Buffering.");
});

tts_player.on(AudioPlayerStatus.Idle, () => {
	console.log("Idle.");
	//SPEAKING = false;
	//if (msg_queue.length > 0)
		//cmd.read(msg_queue[0]);
	msg_queue.shift(); // ^^? 
});

function enunciate(string){
	console.log("Called enunciate with `"+string+"`.");
	const stream = DiscordTTS.getVoiceStream("Hey there.");
	const audioResource = createAudioResource(stream, {inlineVolume: true});
	tts_player.play(audioResource);
	return "Enunciated."
}
