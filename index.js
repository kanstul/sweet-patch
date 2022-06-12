const { Client, Intents } = require('discord.js')
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
//const { token } = require('./config.json');
const ytdl = require("ytdl-core");
const PlayDL = require('play-dl');


const player = createAudioPlayer();
const test = './second-of-silence.mp3'; //'https://www.youtube.com/watch?v=cdwal5Kw3Fc';
let resource = createAudioResource(test, {inlineVolume: true});


const client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});

// Variables and such. 
const { token } = require('./config.json');
var TALKING = new Set(); 
var PLAYLIST = [];
var HISTORY = [];
	var PLAYING = false; // Find a better way to do this. 
var COMMANDS = []; // This can REALLY be known at compile time. 
var CURRENTLY_PLAYING = "Nothing played yet.";
var connection = null;

// Variables and such. 
let { // `yawny`. 
	LOOP = false,
	LOOP_FRONT = false, 
	VOLUME = 1.0,
	AUTO_PLAY = true,
	DAMP = 0.1,
	MAX_HISTORY_SIZE = 100,
	MAX_PLAYLIST_SIZE = 50,
	LOCK_TO_CHANNEL_ONCE_JOINED = false,
	FADE_TIME = 5000,
	REQUIRE_ROLE_TO_USE = false,
	BOT_USERS = "everyone",
	REQUIRE_ROLE_FOR_VOLUME = false,
	VOLUME_USERS = "everyone"
} = require('./config.json');

const {
	SILLY_MODE = false,
	ABSOLUTE_MAX_HISTORY_SIZE = 1000, // Math.min this, somehow. 
	ABSOLUTE_MAX_PLAYLIST_SIZE = 255
} = require('./config.json');
// Variables and such. 

cmd = new Object;

/*
const DiscordTTS = require("discord-tts");
cmd.test = function(interaction) {
	const stream = DiscordTTS.getVoiceSTream("Hello, text to speech world!");
	const audioResource = createAudioResource(stream, {inlineVolume: true});
	player.play(audioResource);
}
*/
cmd.list = async function(interaction) {
	console.log(PLAYLIST);
	response = [];
	await list(response,PLAYLIST);
	//response = list([],PLAYLIST); // But why not? 

	return (response.length !== 0)? '\`\`\`'+response.join('\n')+'\`\`\`' : "Playlist empty.";
}
cmd.kick = function(interaction) {
	kick();
	return ('\`*Rattle*\`');
}
cmd.skip = function(interaction) {
	// play_front(); // This also works, but I think it's better to leave control of this in the hands of /auto and AUTO_PLAY. 
	player.stop();
	return (interaction,'Skipping.');
}
cmd.stop = function(interaction) {
	player.pause();
	return (interaction,'Paused.');
}
cmd.resume = function(interaction) {
	player.unpause(); // Use && and fit into a single line instead? 
	return (interaction,'Resumed.'); 
}
cmd.join = async function(interaction) {
	/*
	var user_connection = getVoiceConnection(interaction.guildId)
	console.log(user_connection);
	//console.log("In join, "+connection+".");
	if (user_connection == undefined) {
		interaction.reply("You are not in a voice channel.");
		return;
	} // Some other time. 
	*/

	connection = getVoiceConnection(interaction.guildId);

	if (!LOCK_TO_CHANNEL_ONCE_JOINED || !connection) {
		/*var */connection = joinVoiceChannel({
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
			TALKING.add(`${userId}`)
		});
		connection.receiver.speaking.on("end", (userId) => {
			TALKING.delete(`${userId}`)
		});
		return (interaction,'Joined.');
	} catch(error) {
		console.warn(error); // Look into console.warn as compared to console.error. 
		return (interaction,'Error in join function.');
	}
}
cmd.what = function(interaction) {
	return "Currently playing is: "+PLAYLIST[0];
}
cmd.set = function(interaction) {
	if (REQUIRE_ROLE_FOR_VOLUME && !interaction.member.roles.cache.some(r => r.name === VOLUME_USERS)) {
		return "You must have the "+VOLUME_USERS+" role to adjust the volume.  It is currently "+VOLUME+'.';
	}
	response = 'Volume was \`'+VOLUME+'\`, is '
	VOLUME = interaction.options.getNumber('level') / 10.0;
	response = response.concat('now \`'+VOLUME+'\`.');
	return response;
}
cmd.damp = function(interaction) {
	response = 'Damp was \`'+DAMP+'\`, is '
	DAMP = interaction.options.getNumber('damp') / 100.0; // Is 100 appropriate? 
	// Could use DAMP = Math.max(DAMP, interaction.opt..., but this is more fun! 
	return response.concat('now \`'+DAMP+'\`.');
}
cmd.history = async function(interaction) {
	response = [];
	await list(response,HISTORY);
	//response = list([],HISTORY); // Seriously, why?  // Fixthis.
	return (response.length !== 0)? '\`\`\`'+response.join('\n')+'\`\`\`' : "No songs have been played.";
}
cmd.auto = function(interaction) {
	AUTO_PLAY = !AUTO_PLAY;
	return "Auto-play is now "+(AUTO_PLAY?"on.":"off."); // The ternary operator isn't professional; just for fun. 
}
cmd.next = function(interaction) {
	play_front(); // Maybe I should just fold this into `skip`? 
	return "Forcibly playing "+PLAYLIST[0]+'.';
}
cmd.loop = function(interaction) {
	LOOP = !LOOP;
	if (LOOP) LOOP_FRONT = false;
	return "Will "+(LOOP?"now":"not")+" loop playlist.";
}
cmd.keep = function(interaction) {
	LOOP_FRONT = !LOOP_FRONT;
	if (LOOP_FRONT) LOOP = false;
	return "Will "+(LOOP_FRONT?"now":"not")+" loop first song.";
}
cmd.help = function(interaction) {
	response = []; // Maybe this funny response and loop thing should be its own function.  That'd be more `LISP`y. 
	for (const command of COMMANDS)
		response.push((capitalize(command.name)+": ").padEnd(10).concat(command.description)); // This is kind of messy. 
	return '\`\`\`'+response.join('\n')+'\`\`\`';
}
cmd.strike = function (interaction) {
	from = interaction.options.getInteger('from');
	until = interaction.options.getInteger('until');
	//if (until == undefined) until = from; // Fix later.
	if (PLAYLIST.length >= MAX_PLAYLIST_SIZE || from < 0)
		return "Index out of bounds.";
	song_removed = PLAYLIST[from]+"`Note to self, have it return all songs deleted by examining the way history works. -- Programmer's note.`";
	response = [];
	list(response,PLAYLIST);
	PLAYLIST.splice(from,(until - from) + 1);
	return "Removed "+song_removed+" from playlist.";
}
cmd.fade = function(interaction) {
	response = 'Fade was \`'+FADE_TIME+'\`, is '
	FADE_TIME = Math.max(interaction.options.getInteger('fade'),ONE);
	return response.concat('now \`'+FADE_TIME+'\`.');
}
cmd.pop = function(interaction) {
	return "Removed "+PLAYLIST.pop()+" from playlist.";
}
cmd.insert = function(interaction) {
	cmd.accrue(interaction.options.getString('url'),interactions.options.getInteger('index'));
	return "HEY FIX THIS RETURN STATEMENT.";
}
cmd.push = function(interaction) {
	cmd.accrue(interaction.options.getString('url'),PLAYLIST.length);
	return "Appended "+PLAYLIST[PLAYLIST.length-1]+".";
}
cmd.jump = function(interaction) {
	cmd.accrue(interaction.options.getString('url'),0);
	return "Prepended "+PLAYLIST[0]+".";
}
cmd.play = function(interaction) {
	//if (!connection) 
		cmd.join(interaction);
	PLAYING = false; 
	cmd.jump(interaction);
	return "Now playing "+PLAYLIST[0]+'.';
}
// Make this function private. \/ 
cmd.accrue = function(entry,index){
	//console.log("Called accrue, playing is "+PLAYING+".");
	songs = remove_non_URL_characters(entry).split(' ').slice(0,MAX_PLAYLIST_SIZE);
	PLAYLIST.splice(index,0,...songs).slice(0,MAX_PLAYLIST_SIZE);
	if (!PLAYING && AUTO_PLAY)
		play_front();
	return PLAYLIST[0] ?? "YAWNY";
}
	// if commandName === 'halt'  // Good name; for something. 

// Program starts here. 
// ====================

client.once('ready', ()=> {
	let argv = process.argv; // Should this be global? 
	console.log(argv);
	COMMANDS = initialize_commands(!argv.includes('fast')); //! Use argc/argv here. 
	console.log('Ready!');
	console.log(get_timestamp('https://www.youtube.com/watch?v=LSCICFwlv8o'));
	console.log(get_timestamp('https://youtu.be/LSCICFwlv8o?t=1'));
	play_front(); // Why do we have this? 
	let fade_time = FADE_TIME; // Should this be moved? // No, it doesn't have to be accessed anywhere but in this function. 
const ONE = (SILLY_MODE)? MAX_VALUE : 1;
	setInterval( () => { // <== "While true, check every millisecond." 
		if (TALKING.size > 0) { // If people are talking. 
			resource.volume.setVolume(DAMP*VOLUME); // Set the volume to DAMP * VOLUME. 
			fade_time = FADE_TIME;
		}
		else { // If people AREN'T talking. 
			if (fade_time > 0)
				--fade_time; 
			//console.log(fade_time);
			let percentage = Math.min(((FADE_TIME - fade_time) / FADE_TIME) + DAMP, ONE);
			resource.volume.setVolume(percentage * VOLUME);
		}
	},1);
});

function sigmoid (input) { // !!! 
	1 / (1 + 2.7182)
}


function kick() {
	resource = createAudioResource(test, {inlineVolume: true});
	player.play(resource);
} // Don't think that we still need this. 

client.on('interactionCreate', async interaction => {
try {
	if (!interaction.isCommand()) return; // Watch out. 
	// Is this deprecated? 
	
	if (REQUIRE_ROLE_TO_USE && !interaction.member.roles.cache.some(r => r.name === BOT_USERS)){
		respond(interaction,"You must have the "+BOT_USERS+" role to use the bot.");
		return;
	}

	const { commandName } = interaction;
	
	try {
		answer = await cmd[commandName](interaction);
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

function initialize_commands(initialize) {
	// Add another parameter to wipe all commands in the future, that'd be cool. 

		if (typeof initialize != 'boolean'){ // What the actual fuck is this language. 
			console.error('Function `initialize_commands()` was called with an invalid type.');
			return [];
		}

	const { SlashCommandBuilder } = require('@discordjs/builders');
	// Never mind, this language is fucking rad.  You can cause shit to happen in wacky orders by exploiting { } in a function that's being called asynchronously.  That's COOL. 

	const commands = [
		new SlashCommandBuilder().setName('help').setDescription('Lists all commands the bot can perform, and their descriptions.'),
		new SlashCommandBuilder().setName('play').setDescription('==> Immediately joins the channel you\'re in and plays the given song.\n').addStringOption(option => option.setName('url').setDescription('The song played.').setRequired(true)),
		new SlashCommandBuilder().setName('push').setDescription('Appends song to playlist.').addStringOption(option => option.setName('url').setDescription('The song appended.').setRequired(true)),
		new SlashCommandBuilder().setName('jump').setDescription('Prepends song to playlist.').addStringOption(option => option.setName('url').setDescription('The song prepended.').setRequired(true)),
		new SlashCommandBuilder().setName('insert').setDescription('Inserts a given song at a provided index.').addStringOption(opt=>opt.setName('url').setDescription('The song inserted.').setRequired(true)).addIntegerOption(opt=>opt.setName('index').setDescription('The index which the song will be inserted at.').setRequired(true)),
		new SlashCommandBuilder().setName('list').setDescription('Lists playlist.'),
		new SlashCommandBuilder().setName('history').setDescription('Responds with a history of all songs played.'),
		new SlashCommandBuilder().setName('skip').setDescription('Skips to the next song.'),
		new SlashCommandBuilder().setName('next').setDescription('Manually forces the next song to play.'),
		new SlashCommandBuilder().setName('stop').setDescription('Pauses song.'),
		new SlashCommandBuilder().setName('resume').setDescription('Resumes song.'),
		new SlashCommandBuilder().setName('strike').setDescription('Removes songs from the first index given until the second.').addIntegerOption(opt=>opt.setName('from').setDescription('The index of the song to be removed.').setRequired(true)).addIntegerOption(opt=>opt.setName('until').setDescription('The index of the last song to be removed.').setRequired(true)),
		new SlashCommandBuilder().setName('pop').setDescription('Removes the last song in the playlist.'),
		new SlashCommandBuilder().setName('auto').setDescription('Toggles autoplay feature.'),
		new SlashCommandBuilder().setName('loop').setDescription('Played songs are immediately appended to the end of the playlist.'),
		new SlashCommandBuilder().setName('keep').setDescription('Continually plays the current song.'),
		new SlashCommandBuilder().setName('set').setDescription('Sets the volume.').addNumberOption(option => option.setName('level').setDescription('The new volume level.').setRequired(true)),
		new SlashCommandBuilder().setName('damp').setDescription('Sets how much the volume is damped when people start talking, send 100 to functionally disable.').addNumberOption(option => option.setName('damp').setDescription('The new damping level.').setRequired(true)),
		new SlashCommandBuilder().setName('fade').setDescription('==> Sets the amount of time it takes to fade in; set low to functionally disable.').addIntegerOption(option => option.setName('fade').setDescription('The new fade level.').setRequired(true)),
		new SlashCommandBuilder().setName('join').setDescription('Joins the voice channel that you\'re in.'),
		new SlashCommandBuilder().setName('what').setDescription('Responds with currently playing song.'),
		new SlashCommandBuilder().setName('kick').setDescription('Sometimes fixes the bot.'),
		//new SlashCommandBuilder().setname('test').setDescription('A test function, it should only be used by the developer.  REMOVE ME.')
		// Use commas. 
	]
		.map(command => command.toJSON());

	// Add functionality to wipe commands.  // TAGYOUIT. 
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

// Utility functions. 
function capitalize(string){
	if (typeof string != 'string' || string.length < 1) {
		console.error("Error in `capitalize()`.")
		return string;
	}
	return string.charAt(0).toUpperCase().concat(string.slice(1));
}

// Should this be `async-await`ish? 
function affirm(conditional, error_msg, interaction){ // Bullying the macroless language into having macros. 
	if (conditional)
		return false;
	console.log("Affirm failed.");
	respond(interaction,error_msg);
	return true;
//	if (!conditional)
//		interaction.reply(error_msg);
//	console.log("Affirm returning",!conditional+'.');
//	return !conditional;
}

function remove_non_URL_characters(string){
	let legal_characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~:/?#[]@!$&'()*+;="; // , // Comma is deliberately excluded; is that prudent? 
	original_string = string;
	fnl = "";
	for (c of legal_characters)
		string = string.replaceAll(c,' ');
	for (let i=0;i<original_string.length;++i)
		fnl = fnl.concat(string.charAt(i) == ' '? original_string.charAt(i) : ' ');
	return fnl;
}

function respond(interaction,msg) {
	console.log(msg);
	interaction.reply(msg);
	return;
}

function get_timestamp(url) {
	//console.log(parseInt(/t=(\d+)/.exec('https://youtu.be/8ptm5NuIthg?t=10')[1]));
	try {
		return parseInt(/t=(\d+)/.exec(url)[1]);
	}
	catch {
		return 0;
	}
	// Thanks, `The Great Old One of Javascript`. 
}


player.on(AudioPlayerStatus.Idle, () => {
	PLAYLIST.shift();
	PLAYING = false;
	play_front();
});

//player.on(AudioPlayerStatus.Idle, play_front()); // <===  // Thisthing.

async function list(response,list_given) {
	for (let i=0;i<list_given.length;++i)
	{
		//console.error("In list,",i);
		song = list_given[i];
		try {
			info = await ytdl.getInfo(song);
			//response.push("".concat(i+1,". ",info.videoDetails.title,"\t[",new Date(info.videoDetails.lengthSeconds*1000).toISOString().substring(11,19),"]"));
			response.push("".concat(i/*+1*/,". [",new Date(info.videoDetails.lengthSeconds*1000).toISOString().substring(11,19),"]: ",info.videoDetails.title,'.'));
		} catch (e) {
			// This isn't tripping for some reason, I don't know why. 
			// Because broken promises, investigate at a later date. 
			console.error(e);
			response.push('Invalid song.');
		}
	}
	return response;
}

async function play_front() {
	console.log("HISTORY:");
	console.log(HISTORY);
	console.log('Play_front()');
	if (PLAYLIST.length > 0) {
		PLAYING = true;
		console.log("Playlist[0] is: "+PLAYLIST[0]+".");
		let song = null;
		try {
			song = await PlayDL.stream(PLAYLIST[0], {seek: get_timestamp(PLAYLIST[0])});
		}
		catch (e) {
			// None of this actually executes; why is that? 
			// Because broken promises, investigate at a later date. 
			console.error(e);
			console.log('Bonk.');
		}
		finally {
			console.log('Finally!');
			//PLAYLIST.shift(); // <<===
		}
		try {
			resource = createAudioResource(song.stream, {inputType : song.type, inlineVolume: true});
		}
		catch (e) {
			console.error("NOT A VALID SONG, DOING SOME ODD THINGS TO MAKE IT WORK.");
			PLAYLIST.shift();
			play_front();
			return;
		}

		HISTORY.unshift(PLAYLIST[0]);
		if (HISTORY.length > MAX_HISTORY_SIZE)
			HISTORY.pop();

		//console.log("We just created an audio resource of "+song+".");
		player.play(resource);

		if (LOOP)
			PLAYLIST.push(PLAYLIST[0]);
		if (LOOP_FRONT)
			PLAYLIST.unshift(PLAYLIST[0]);
	}
	else
		PLAYING = false; ///
	//return CURRENTLY_PLAYING;
}

client.login(token);

// TODO: Implement YouTube search function. 
// TODO: CTRL+F "HEY_FIX_ME".
// !!!!!!!!!!!!!!!!!!!!!!!!!!!
// TODO: CTRL+F "DOING SOME ODD THINGS TO MAKE IT WORK."
// TODO: Fix the fact that `insert` can overload the playlist, make it safe like `jump` and `push` are. 
// TODO: Change everything from `ytdl` to `play-dl`, particularly the functions that get song information. 
// TODO: Fix things so that `play_front()` isn't `async` anymore, it's dumb!  Fix all the `await play_front()`s. 
// TODO: Add functionality to change the maximum PLAYLIST and HISTORY lengths: max(_,_) them against some reasonable ABSOLUTE_MAX... value. 
// TODO: Fix the stupid try-catch block that's making `get_timestamp()` work. 
// TODO: CTRL+F "Thisthing."
// TODO: Play from timestamp! 
// TODO: CTRL+F "YAWNY".
// TODO: Affirm commands by voice. 
// TODO: CTRL+F "REALLY MOVE". 
// TODO: Consider adding "CURRENTLY_PLAYING" to the `list` command. 
// TODO: Clean up the file directory. 
// TODO: CTRL+F "Find a better way to do this."
// TODO: THIS IS A GOOD ONE.  Add a `move` function that moves a song from somewhere in the playlist to somewhere else.  Will be easier if we rewrite everything to work by `!eval`ing. 
// TODO: CTRL+F "But why not?"
// TODO: Implement `abscond`. 
// TODO: Have `interaction.reply` by voice. 
// TODO: Make `remove_non_URL_characters` better. 
// TODO: CTRL+F "TAGYOUIT."
// TODO: Consider what global variables should be `const` and assign them appropriately. 
// TODO: Fix that damnable `async` nonsense that's going on in the `cmd.list` function! 
// TODO: Pick some more careful names for the `argv`s. 
// TODO: CTRL+F "Some other time."
// TODO: CTRL+F "Fix later." 
// TODO: Add a function to remove videos by URL/title/whatever. 
// TODO: CTRL+F "Fixthis."

//TEST: 
// TEST: Re-order the list that the commands go in. 
// TEST: Add functionality such that only users with a certain role can operate the bot, or at least the volume. 
// TEST: Fix bug where if you enter commands too fast, particularly `list`, it just crashes and dies. 
// TEST: Consider replacing every `interaction.reply` with a function that `interaction.reply`s and ALSO logs it to the console; might be cleaner. 
// TEST: Functions `loop` and `keep`! 
// TEST: Clean up `accrue`.
// TEST: Fix the critical v14 bug! 

//NOTE:
// NOTE: Weird things happen with a FADE_TIME of `0`, locked it to `ONE` with a Math.min. 

//DONE: 
// DONE: Add a function to insert a song at a given index. 
// DONE: Add a function that deletes a song given an index.  (Not hard; have headache.) 
// DONE: Add multiple songs with a single command. 
// DONE?: CTRL+F "syzygy" !!!!
// DONE: Add a function to delete the last song.  (What to name it?) 
// DONE: Overload the `play` function! 
// DONE: Make sure that LOOP and LOOP_FRONT can't both be set at the same time. 
// DONE: Delete all songs BETWEEN TWO GIVEN NUMBERS. 
// DONE: Fix CTRL+F "Dumbhack.". 
// DONE: CTRL+F "Weird bug."
// DONE?: Redo absolutely everything to use zero indexing. 
// DONE: CTRL+F "INVESTIGATE."

