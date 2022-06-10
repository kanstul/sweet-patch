function initialize_commands(initialize) {
	// Add another parameter to wipe all commands in the future, that'd be cool. 

		if (typeof initialize != 'boolean'){ // What the actual fuck is this language. 
			console.error('Function `initialize_commands()` was called with an invalid type.');
			return [];
		}

	const { SlashCommandBuilder } = require('@discordjs/builders');
	// Never mind, this language is fucking rad.  You can cause shit to happen in wacky orders by exploiting { } in a function that's being called asynchronously.  That's COOL. 

	const commands = [
		new SlashCommandBuilder().setName('list').setDescription('Lists playlist.'),
		new SlashCommandBuilder().setName('skip').setDescription('Skips to the next song.'),
		new SlashCommandBuilder().setName('stop').setDescription('Pauses song.'),
		new SlashCommandBuilder().setName('play').setDescription('Resumes song.'),
		new SlashCommandBuilder().setName('kick').setDescription('Sometimes fixes the bot.'),
		new SlashCommandBuilder().setName('join').setDescription('Joins the voice channel that you\'re in.'),
		new SlashCommandBuilder().setName('what').setDescription('Responds with currently playing song.'),
		new SlashCommandBuilder().setName('set').setDescription('Sets the volume.').addNumberOption(option => option.setName('level').setDescription('The new volume level.').setRequired(true)),
		new SlashCommandBuilder().setName('push').setDescription('Appends song to playlist.').addStringOption(option => option.setName('song').setDescription('The song appended.').setRequired(true)),
		new SlashCommandBuilder().setName('jump').setDescription('Prepends song to playlist.').addStringOption(option => option.setName('song').setDescription('The song prepended.').setRequired(true)),
		new SlashCommandBuilder().setName('damp').setDescription('Sets how much the volume is damped when people start talking, send 100 to functionally disable.').addNumberOption(option => option.setName('damp').setDescription('The new damping level.').setRequired(true)),
		new SlashCommandBuilder().setName('history').setDescription('Responds with a history of all songs played.'),
		new SlashCommandBuilder().setName('auto').setDescription('Toggles autoplay feature.'),
		new SlashCommandBuilder().setName('next').setDescription('Manually forces the next song to play.'),
		new SlashCommandBuilder().setName('loop').setDescription('Continually plays the current song.'),
		new SlashCommandBuilder().setName('keep').setDescription('Played songs are immediately appended to the end of the playlist.'),
		new SlashCommandBuilder().setName('help').setDescription('Lists all commands the bot can perform, and their descriptions.'),
		new SlashCommandBuilder().setName('insert').setDescription('Inserts a given song at a provided index.').addStringOption(opt=>opt.setName('song').setDescription('The song inserted.').setRequired(true)).addIntegerOption(opt=>opt.setName('index').setDescription('The index which the song will be inserted at.').setRequired(true)),
		new SlashCommandBuilder().setName('strike').setDescription('Removes song at a given index.').addIntegerOption(opt=>opt.setName('index').setDescription('The index of the song to be removed.').setRequired(true)),
		// Use commas. 
	]
		.map(command => command.toJSON());

	// Add functionality to wipe commands. 
	// if (wipe_commands) { /* do stuff */ } 
	if (initialize) 
	{
		const { REST } = require('@discordjs/rest');
		const { Routes } = require('discord-api-types/v9');
		const { clientId, guildId, token } = require('./config.json');
		const rest = new REST({ version: '9' }).setToken(token);
		rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
			.then(() => console.log('Registration complete.'))
			.catch(console.error);
	}
	return commands;
}

// Program starts here. 
// ====================


const { Client, Intents } = require('discord.js')
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { token } = require('./config.json');
const ytdl = require("ytdl-core");


const player = createAudioPlayer();
const test = './second-of-silence.mp3';
let resource = createAudioResource(test, {inlineVolume: true});

//const name = "Muze, ";


const client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});

// Variables and such. 
var TALKING = new Set(); 
var PLAYLIST = [];
var LOOP = false;
var LOOP_FRONT = false;
var VOLUME = 1.0;
var AUTO_PLAY = false;
var CURRENTLY_PLAYING = "Nothing played yet.";
var DAMP = 0.1;
var HISTORY = [];
var MAX_HISTORY_SIZE = 100;
var MAX_PLAYLIST_SIZE = 50;
	var PLAYING = false; // Find a better way to do this. 
var COMMANDS = []; // This can REALLY be known at compile time. 
var LOCK_TO_CHANNEL_ONCE_JOINED = false;
// Variables and such. 
// Maybe these should all be `const`s locked to the `config.json`?  //syzygy

client.once('ready', ()=> {
	COMMANDS = initialize_commands(true); //! Use argc/argv here. 
	//console.log(COMMANDS);
	/*
	for (const command of COMMANDS) { // Why did `Java`Script use `const` rather than `final`?  So weird. 
		console.log(command.name);
		console.log(command.description);
	}
	*/
	//global.kick(); // Have to use global rather than window rather than eval. 
	console.log('Ready!');
	   player.play(resource); // <==
	setInterval( () => {
		if (TALKING.size > 0) {
			resource.volume.setVolume(DAMP*VOLUME);
		}
		else {
			resource.volume.setVolume(VOLUME);
		}
	},1);
});

/*
client.once('ready',setInterval(()=>{
	if (TALKING.size > 0)
		resource.volume.setVolume(DAMP*VOLUME);
	else
		resource.volume.setVolume(VOLUME);
}, 1)); // One line this? 
*/

function kick() {
	resource = createAudioResource(test, {inlineVolume: true});
	player.play(resource);
} // Don't think that we still need this.  At least map it to a brief YouTube video instead. 

async function list(response,list_given) {
	for (i=0;i<list_given.length;++i)
	{
		song = list_given[i];
		try {
			info = await ytdl.getInfo(song);
			response.push("".concat(i+1,". ",info.videoDetails.title,"\t[",new Date(info.videoDetails.lengthSeconds*1000).toISOString().substring(11,19),"]"));
		} catch (e) {
			// This isn't tripping for some reason, I don't know why. 
			// Because broken promises, investigate at a later date. 
			console.error(e);
			response.push('Invalid song.');
		}
	}
	return response;
}

//cmds // Navigational aid. 
client.on('interactionCreate', async interaction => {
try {
	if (!interaction.isCommand()) return; // Watch out. 
	// Is this deprecated? 

	const { commandName } = interaction;
	
	if (commandName === 'list') {
		response = [];
		await list(response,PLAYLIST);

		if (response.length === 0)
			await interaction.reply("Playlist empty.");
		else
			await interaction.reply('\`\`\`'+response.join('\n')+'\`\`\`');
		return;
	}
	if (commandName === 'kick') {
		kick();
		await interaction.reply('\`*Rattle*\`');
		return;
	}
	if (commandName === 'skip') {
		// play_front(); // This also works, but I think it's better to leave control of this in the hands of /auto and AUTO_PLAY. 
		player.stop();
		await interaction.reply('Skipping.');
		return;
	}
	if (commandName === 'stop') {
		player.pause();
		await interaction.reply('Paused.');
		return;
	}
	if (commandName === 'play') {
		player.unpause(); // Use && and fit into a single line instead? 
		await interaction.reply('Resumed.'); 
		return;
	}
	if (commandName === 'join'){
		var connection = getVoiceConnection(interaction.guildId)
		if (!LOCK_TO_CHANNEL_ONCE_JOINED || !connection) {
			connection = joinVoiceChannel({
				channelId: interaction.member.voice.channelId,
				guildId: interaction.guildId,
				adapterCreator: interaction.guild.voiceAdapterCreator,
				selfDeaf: false,
				selfMute: false,
			});
			connection.subscribe(player); // <== 
		}
		try {
			await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
			// if ID == bot ID then return, or something. 
			// Ended up not being necessary, bot doesn't register when it starts TALKING. 
			// Don't know why but not going to look a gift horse in the mouth for the moment. 
			// Should look into it at a future date though. 
			connection.receiver.speaking.on("start", (userId) => {
				///console.log(`${userId} start`);
				TALKING.add(`${userId}`)
			});
			connection.receiver.speaking.on("end", (userId) => {
				///console.log(`${userId} end`);
				TALKING.delete(`${userId}`)
			});
			interaction.reply('Joined.');
		} catch(error) {
			console.warn(error); // Look into console.warn as compared to console.error. 
		}
		return;
	}
	if (commandName === 'what'){
		await interaction.reply(CURRENTLY_PLAYING);
		return;
	}
	if (commandName === 'set'){
		response = 'Volume was \`'+VOLUME+'\`, is '
		VOLUME = interaction.options.getNumber('level') / 10.0;
		response = response.concat('now \`'+VOLUME+'\`.');
		await interaction.reply(response);
		return;
	}
	//awe
	if (commandName === 'push'){
		if (affirm(PLAYLIST.length <= MAX_PLAYLIST_SIZE, "Couldn't add, playlist full.", interaction)) return;
		PLAYLIST.push(interaction.options.getString('song'));
		await interaction.reply("Appended "+PLAYLIST[PLAYLIST.length-1]+".");
		//console.log("Appended",PLAYLIST[PLAYLIST.length-1]+"."); // Interesting that the pythonish `,` notation doesn't work in repl- wait, never mind, I get it now. 
		if (!PLAYING && AUTO_PLAY && PLAYLIST.length === 1) 
			play_front();
		return;
	}
	if (commandName === 'jump') {
		if (affirm(PLAYLIST.length <= MAX_PLAYLIST_SIZE, "Couldn't add, playlist full.", interaction)) return;
		PLAYLIST.unshift(interaction.options.getString('song'));
		await interaction.reply("Prepended "+PLAYLIST[0]+".");
		if (!PLAYING && AUTO_PLAY && PLAYLIST.length === 1) 
			play_front();
		return;
	}
	if (commandName === 'damp'){
		response = 'Volume was \`'+DAMP+'\`, is '
		DAMP = interaction.options.getNumber('damp') / 100.0; // Is 100 appropriate? 
		// Could use DAMP = Math.max(DAMP, interaction.opt..., but this is more fun! 
		response = response.concat('now \`'+DAMP+'\`.');
		await interaction.reply(response);
	}
	if (commandName === 'history'){
		response = [];
		await list(response,HISTORY);
		if (response.length === 0)
			await interaction.reply("No songs have been played.");
		else
			await interaction.reply('\`\`\`'+response.join('\n')+'\`\`\`');
		return;
	}
	if (commandName === 'auto'){
		AUTO_PLAY = !AUTO_PLAY;
		await interaction.reply("Auto play is now "+(AUTO_PLAY?"on.":"off.")); // The ternary operator isn't professional; just for fun. 
		return;
	}
	if (commandName == 'next'){ 
		play_front(); // Maybe I should just fold this into `skip`? 
		return;
	}
	if (commandName === 'loop'){
		LOOP = !LOOP;
		await interaction.reply("Will "+(LOOP?"now":"not")+" loop playlist.");
		return;
	}
	if (commandName === 'keep'){
		LOOP_FRONT = !LOOP_FRONT;
		await interaction.reply("Will "+(LOOP_FRONT?"now":"not")+" loop first song.");
		return;
	}
	if (commandName === 'help'){
		response = []; // Maybe this funny response and loop thing should be its own function.  That'd be more `LISP`y. 
		for (const command of COMMANDS)
			response.push((capitalize(command.name)+": ").padEnd(10).concat(command.description)); // This is kind of messy. 
		await interaction.reply('\`\`\`'+response.join('\n')+'\`\`\`');
		return;
	}
	if (commandName === 'insert'){
		index = interaction.options.getInteger('index') - 1;
		if (affirm(PLAYLIST.length <= MAX_PLAYLIST_SIZE && index < PLAYLIST.length,"Index out of bounds.",interaction)) return;
		PLAYLIST.splice(index,0,interaction.options.getString('song'));
		await interaction.reply("Inserted "+PLAYLIST[index+1]+'.');
//if (!PLAYING && AUTO_PLAY && PLAYLIST.length === 1) play_front(); Left out on purpose. 
		// Wait, we left this out.  Why does it immediately start playing?  Weird bug. 
		return;
	}
	if (commandName === 'strike') {
		index = interaction.options.getInteger('index') - 1;
		if (affirm(index < PLAYLIST.length && index >= 0),"Failed: index out of bounds.",interaction) return;
		song_removed = PLAYLIST[index];
		PLAYLIST.splice(index,1);
		await interaction.reply("Removed "+song_removed+" from playlist.");
		return;
	}

	// if commandName === 'halt'  // Good name; for something. 
	//Cmds // Navigational aid. 
} catch (e) {
	console.error(e);
	console.error("Error in command function.");
	}
});

function capitalize(string){
	if (typeof string != 'string' || string.length < 1) {
		console.error("Error in `capitalize()`.")
		return string;
	}
	return string.charAt(0).toUpperCase().concat(string.slice(1));
}


	player.on(AudioPlayerStatus.Idle, () => {
		PLAYING = false;
		play_front();
	});

//player.on(AudioPlayerStatus.Idle, play_front()); // <=== 

function play_front() {
	console.log('Play_front()');
	if (PLAYLIST.length > 0){
		PLAYING = true;
		if (LOOP) // Could move this to the end and switch for CURRENTLY_PLAYING, might be better since it'll push out any invalid songs that way. 
			PLAYLIST.push(PLAYLIST[0]); // Not particularly significant either way. 
		console.log("Playlist[0] is: "+PLAYLIST[0]+".");
		song = null;
		try {
			song = ytdl(PLAYLIST[0]);
		}
		catch (e) {
			// None of this actually executes; why is that? 
			// Because broken promises, investigate at a later date. 
			console.error(e);
			console.log('Bonk.');
			// return; Absolutely MUST NOT have this line, because the song hasn't been unshifted yet. 
			// Actually should REALLY MOVE THE UNSHIFT EARLIER BECAUSE OF THAT. 
			// Like in a breadth-first search, when you tmp=q.front();q.pop();
		}
		resource = createAudioResource(song, {inlineVolume: true});
			// !!! 
			CURRENTLY_PLAYING = PLAYLIST[0]; // WATCH OUT: VARIABLE'S GLOBAL.  
			// SHOULD BE FINE SINCE IN ORDER TO GET HERE, MUST BE A YOUTUBE VIDEO. 
		console.log("We just created an audio resource of "+song+".");
		player.play(resource);
		if (!LOOP_FRONT) {
			HISTORY.unshift(PLAYLIST[0]); // Use CURRENTLY_PLAYING instead? 
			if (HISTORY.length > MAX_HISTORY_SIZE)
				HISTORY.pop();
			PLAYLIST.shift();
		}
	}
	else
		PLAYING = false; ///
}

// Should this be `async-await`ish? 
function affirm(conditional, error_msg, interaction){ // Bullying the macroless language into having macros. 
	if (!conditional)
		interaction.reply(error_msg);
	console.log("Affirm returning",conditional+'.');
	return !conditional;
}

client.login(token);

// TODO: Add a function to delete the last song.  (What to name it?) 
// TODO: Add functionality such that only users with a certain role can operate the bot, or at least the volume. 
// TODO: Add functionality to change the maximum PLAYLIST and HISTORY lengths: max(_,_) them against some reasonable ABSOLUTE_MAX... value. 
// TODO: CTRL+F "REALLY MOVE". 
// TODO: Re-order the list that the commands go in. 
//
// TODO: CTRL+F "syzygy" !!!!
//
//TODO: CTRL+F "//!" 
//TODO: Carefully consider whether or not we should switch the whole thing to zero indexing. 
//TODO: Consider adding "CURRENTLY_PLAYING" to the `list` command. 
//TODO: Clean up the file directory. 
//TODO: Consider replacing every `interaction.reply` with a function that `interaction.reply`s and ALSO logs it to the console; might be cleaner. 
//TODO: CTRL+F "Find a better way to do this."
//TODO: CTRL+F "Weird bug."
//TODO: THIS IS A GOOD ONE.  Add a `move` function that moves a song from somewhere in the playlist to somewhere else.  Will be easier if we rewrite everything to work by `!eval`ing. 

//DONE: 
// TODO: Check if using `if` rather than `else if` wouldn't be faster since the whole function is asynchronous. 
// DONE: Add a function to insert a song at a given index. 
// DONE: Add a function that deletes a song given an index.  (Not hard; have headache.) 
