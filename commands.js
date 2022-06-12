/*
const { Client, Intents } = require('discord.js')
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
//const { token } = require('./config.json');
const ytdl = require("ytdl-core");
const PlayDL = require('play-dl');


const player = createAudioPlayer();
const tts_player = createAudioPlayer();
const test = './second-of-silence.mp3'; //'https://www.youtube.com/watch?v=cdwal5Kw3Fc';
let resource = createAudioResource(test, {inlineVolume: true});

// Variables and such. 
var TALKING = new Set(); 
var PLAYLIST = [];
var HISTORY = [];
	var PLAYING = false; // Find a better way to do this. 
var COMMANDS = []; // This can REALLY be known at compile time. 
var CURRENTLY_PLAYING = "Nothing played yet.";
var connection = null;
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
const DiscordTTS = require("discord-tts");
*/

/*export */class Cmd {

static test(interaction) {
	const stream = DiscordTTS.getVoiceStream(interaction.options.getString('thisisjustfortesting'));
	const audioResource = createAudioResource(stream, {inlineVolume: true});
	player.play(audioResource);
	return "Called the test function.";
}

static list = async function(interaction) {
	console.log(PLAYLIST);
	response = [];
	await list(response,PLAYLIST);
	//response = list([],PLAYLIST); // But why not? 

	return (response.length !== 0)? '\`\`\`'+response.join('\n')+'\`\`\`' : "Playlist empty.";
}
static kick(interaction) {
	kick();
	return ('\`*Rattle*\`');
}
static skip(interaction) {
	// play_front(); // This also works, but I think it's better to leave control of this in the hands of /auto and AUTO_PLAY. 
	player.stop();
	return (interaction,'Skipping.');
}
static stop(interaction) {
	player.pause();
	return (interaction,'Paused.');
}
static resume(interaction) {
	player.unpause(); // Use && and fit into a single line instead? 
	return (interaction,'Resumed.'); 
}
static join = async function(interaction) {
	/*
	var user_connection = getVoiceConnection(interaction.guildId)
	console.log(user_connection);
	//console.log("In join, "+connection+".");
	if (user_connection == undefined) {
		interaction.reply("You are not in a voice channel.");
		return;
	} // Some other time. 
	*/
	//return /*await*/ join(interaction);
	return Join(interaction.guildId,interaction.member.voice.channelId,interaction.guild.voiceAdapterCreator);
}

static async Join(guildId,channelId,adapterCreator) {
	connection = getVoiceConnection(guildId);

	if (!LOCK_TO_CHANNEL_ONCE_JOINED || !connection) {
		/*var */connection = joinVoiceChannel({
			channelId: channelId,
			//channelId: interaction.member.voice.channelId,
			//channelId: client.guilds.cache.get("860726754184527882").members.cache.get("230526630035062784").voice.channelId,
			guildId: guildId,
			//guildId: interaction.guildId,
			//guildId: "860726754184527882",
			adapterCreator: adapterCreator,
			//adapterCreator: interaction.guild.voiceAdapterCreator,
			//adapterCreator: client.guilds.cache.get("860726754184527882").voiceAdapterCreator,
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
		return (/*interaction,*/'Joined.'); // Howthehell?
	} catch(error) {
		console.warn(error); // Look into console.warn as compared to console.error. 
		return (/*interaction,*/'Error in join function.'); // Howthehell?
	}
}
static what(interaction) {
	return "Currently playing is: "+PLAYLIST[0];
}
static set(interaction) {
	if (REQUIRE_ROLE_FOR_VOLUME && !interaction.member.roles.cache.some(r => r.name === VOLUME_USERS)) {
		return "You must have the "+VOLUME_USERS+" role to adjust the volume.  It is currently "+VOLUME+'.';
	}
	response = 'Volume was \`'+VOLUME+'\`, is '
	VOLUME = interaction.options.getNumber('level') / 10.0;
	response = response.concat('now \`'+VOLUME+'\`.');
	return response;
}
static damp(interaction) {
	response = 'Damp was \`'+DAMP+'\`, is '
	DAMP = interaction.options.getNumber('damp') / 100.0; // Is 100 appropriate? 
	// Could use DAMP = Math.max(DAMP, interaction.opt..., but this is more fun! 
	return response.concat('now \`'+DAMP+'\`.');
}
static history = async function(interaction) {
	response = [];
	await list(response,HISTORY);
	//response = list([],HISTORY); // Seriously, why?  // Fixthis.
	return (response.length !== 0)? '\`\`\`'+response.join('\n')+'\`\`\`' : "No songs have been played.";
}
static auto(interaction) {
	AUTO_PLAY = !AUTO_PLAY;
	return "Auto-play is now "+(AUTO_PLAY?"on.":"off."); // The ternary operator isn't professional; just for fun. 
}
static next(interaction) {
	play_front(); // Maybe I should just fold this into `skip`? 
	return "Forcibly playing "+PLAYLIST[0]+'.';
}
static loop(interaction) {
	LOOP = !LOOP;
	if (LOOP) LOOP_FRONT = false;
	return "Will "+(LOOP?"now":"not")+" loop playlist.";
}
static keep(interaction) {
	LOOP_FRONT = !LOOP_FRONT;
	if (LOOP_FRONT) LOOP = false;
	return "Will "+(LOOP_FRONT?"now":"not")+" loop first song.";
}
static help(interaction) {
	response = []; // Maybe this funny response and loop thing should be its own function.  That'd be more `LISP`y. 
	for (const command of COMMANDS)
		response.push((capitalize(command.name)+": ").padEnd(10).concat(command.description)); // This is kind of messy. 
	return '\`\`\`'+response.join('\n')+'\`\`\`';
}
static strike (interaction) {
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
static fade(interaction) {
	response = 'Fade was \`'+FADE_TIME+'\`, is '
	FADE_TIME = Math.max(interaction.options.getInteger('fade'),ONE);
	return response.concat('now \`'+FADE_TIME+'\`.');
}
static pop(interaction) {
	return "Removed "+PLAYLIST.pop()+" from playlist.";
}
static insert(interaction) {
	cmd.accrue(interaction.options.getString('url'),interactions.options.getInteger('index'));
	return "HEY FIX THIS RETURN STATEMENT.";
}
static push(interaction) {
	cmd.accrue(interaction.options.getString('url'),PLAYLIST.length);
	return "Appended "+PLAYLIST[PLAYLIST.length-1]+".";
}
static jump(interaction) {
	cmd.accrue(interaction.options.getString('url'),0);
	return "Prepended "+PLAYLIST[0]+".";
}
static play(interaction) {
	//if (!connection) 
		cmd.join(interaction);
	PLAYING = false; 
	cmd.jump(interaction);
	return "Now playing "+PLAYLIST[0]+'.';
}
// Make this function private. \/ 
static accrue(entry,index){
	//console.log("Called accrue, playing is "+PLAYING+".");
	songs = remove_non_URL_characters(entry).split(' ').slice(0,MAX_PLAYLIST_SIZE);
	PLAYLIST.splice(index,0,...songs).slice(0,MAX_PLAYLIST_SIZE);
	if (!PLAYING && AUTO_PLAY)
		play_front();
	return PLAYLIST[0] ?? "YAWNY";
}
	// if commandName === 'halt'  // Good name; for something. 
}
