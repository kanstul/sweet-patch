const { Client, Intents } = require('discord.js')
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice'); // Comment this out later. 
const ytdl = require("ytdl-core");
const PlayDL = require('play-dl');

const player = createAudioPlayer();
const tts_player = createAudioPlayer();

const {initialize_commands,respond} = require('./utility.js');

const client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});

const tts_client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});

// Program starts here. 
// ====================

const {token} = require('./safe.json');
const {tts_token} = require('./safe.json');

const config_settings = require('./config.json');
const commands = require('./commands.js')
Cmd = new commands(config_settings,player);
client.once('ready', ()=> {
	//Cmd['test']();
	let argv = process.argv; // Should this be global? 
	console.log(argv);
	COMMANDS = initialize_commands(!argv.includes('fast')); //! Use argc/argv here. 
	console.log('Ready!');
	//!play_front(); // Why do we have this? 
		let fade_time = Cmd.FADE_TIME;
	setInterval( () => {
		if (Cmd.TALKING.size > 0) {
			Cmd.dropVolume();
			fade_time = Cmd.FADE_TIME;
			//console.log("Someone's talking!")
		}
		else {
			if (fade_time > 0)
				--fade_time; 
			Cmd.raiseVolume(fade_time);
		}
	},1);

});

function sigmoid (input) { // !!! 
	1 / (1 + 2.7182)
}

client.on('interactionCreate', async interaction => {
try {
	if (!interaction.isCommand()) return; // Watch out. 
	// Is this deprecated? 
	
	if (Cmd.REQUIRE_ROLE_TO_USE && !interaction.member.roles.cache.some(r => r.name === Cmd.BOT_USERS)){
		respond(interaction,"You must have the "+BOT_USERS+" role to use the bot.");
		return;
	}

	const { commandName } = interaction;
	
	try {
		answer = await Cmd[commandName](interaction);
		console.log(answer);
		interaction.reply(answer);
	}
	catch (error) {
		try {
			respond(interaction,"Unknown error.");
			console.error(error);
		}
		finally {
			console.error("The expected error.");
		}
	}

} catch (e) {
	console.error(e);
	console.error("Error in command function.");
	}
});

//player.on(AudioPlayerStatus.Idle, Cmd.cycle()); // <===  // Thisthing.

player.on(AudioPlayerStatus.Idle, () => {
	Cmd.cycle();
});

client.login(token);

//const { clientId, guildId } = require('./config.json');
//const SweetPatch = client.guilds.cache.get(guildId)//.members.cache.get(clientId);
tts_client.login(tts_token);
tts_client.once('ready', ()=> {
	console.log('Amai, online!');

	setInterval( async () => { 
	},1);
});

tts_client.on('interactionCreate', async interaction => {
	//respond(interaction,'Disabled.');
	//return;
	const { commandName } = interaction;
	//interaction.applicationId = "983714302978568192" // Didn't work. 
	//respond(interaction,"Application ID is "+interaction.applicationId);
	Cmd.join(interaction);
	//console.log("Type of ID is "+(typeof interaction.applicationId));
});
