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
const db = 250;
		let debouncer = db; // Rename debouncer to lag? 
let down = false;
	setInterval( () => {
		/*
		if (Cmd.TALKING.size > 0 && fade_time < Cmd.FADE_TIME) { // When people are talking. 
			fade_time += Cmd.DROP;
		}
		else if (fade_time > 1) { // When people stop talking. 
			--fade_time;
		}
		*/
		if (Cmd.TALKING.size > 0 && debouncer > 0)
			--debouncer
		else if (debouncer <= db)
			++debouncer

		if (debouncer < 1)
			down = true;
		else if (debouncer > db)
			down = false;

		if (down && fade_time < Cmd.FADE_TIME)
			fade_time += Cmd.DROP;
		else if (fade_time > 1)
			--fade_time;

		Cmd.setVolume(fade_time);
		if (LOG) console.log(fade_time+','+debouncer+','+Cmd.TALKING.size);
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
		await interaction.deferReply();
		let answer = await Cmd[commandName](interaction);
		//console.log("TYPE OF ANSWER IS "+typeof answer+'.');
		//console.log(answer);
		//interaction.reply(answer);
		//interaction.reply("Generic reply.");
		respond(interaction,answer);
	}
	catch (error) {
		try {
			respond(interaction,"Unknown error."); // IS THE FACT THAT WE LIKELY ALRADY BURNED THE INTERACTION IN THE TRY BLOCK A PROBLEM? 
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
