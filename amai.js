const { Client, Intents } = require('discord.js')
const {tts_token, clientId} = require('./safe.json');
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice'); // Comment this out later. 
const {respond} = require('./utility.js');

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
tts_client.once('ready', ()=> {
	console.log('Amai, online!');
});

tts_client.on('interactionCreate', async interaction => {
	const { commandName } = interaction;
	respond(interaction,"Hello, world!");
});
tts_client.on('messageCreate', async msg => {
	//console.log("Amai perceived a message, it said `"+msg.content+"`, and its author's ID was `"+msg.author.id+"`.");
	//console.log("We were looking for `"+clientId+"`.");
	if (msg.author.id == clientId && msg.content == "Joined.") {
		//msg.channel.send("Hey.");
		let connection = getVoiceConnection(msg.guildId);
		connection = joinVoiceChannel({
			channelId: msg.member.voice.channelId,
			guildId: msg.guildId,
			adapterCreator: msg.guild.voiceAdapterCreator,
			selfDeaf: true,
			selfMute: false,
		});
		connection.subscribe(tts_player);
	}
});
