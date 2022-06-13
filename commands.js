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

// class Cmd {

exports.dell = () => {console.log("Works!");}
