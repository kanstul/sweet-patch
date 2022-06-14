const { Client, Intents } = require('discord.js')
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice'); // Comment this out later. 
const ytdl = require("ytdl-core");
const PlayDL = require('play-dl');

const player = createAudioPlayer();

const {initialize_commands,respond} = require('./utility.js');

const client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});

// Program starts here. 
// ====================

const {token} = require('./safe.json');

const config_settings = require('./config.json');
const commands = require('./commands.js')
Cmd = new commands(config_settings,player);
client.once('ready', ()=> {
	let argv = process.argv; // Should this be global? 
	console.log(argv);
	const LOG = argv.includes('log');
	COMMANDS = initialize_commands(!argv.includes('fast')); //! Use argc/argv here. 
	console.log('Ready!');
	//Cmd.play_front(); // Why do we have this? 
	console.log(Cmd.next());
	let fade_time = Cmd.FADE_TIME;
	setInterval( () => {
		if (Cmd.TALKING.size > 0 && fade_time < Cmd.FADE_TIME) {
				fade_time += Cmd.RENAME_FADE;
		}
		else if (fade_time > 1) { 
				--fade_time; 
		}
		Cmd.setVolume(fade_time);
		if (LOG) console.log(fade_time);
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
		respond(interaction,"You must have the "+Cmd.BOT_USERS+" role to use the bot.");
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
