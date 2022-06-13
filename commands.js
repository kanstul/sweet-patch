const { Client, Intents } = require('discord.js')
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
//const { token } = require('./config.json');
const ytdl = require("ytdl-core");
const PlayDL = require('play-dl');

const { initialize_commands, capitalize, remove_non_URL_characters, respond, get_timestamp } = require('./utility.js')

//!const this.player = createAudioPlayer();
const tts_player = createAudioPlayer();
const test = './second-of-silence.mp3'; //'https://www.youtube.com/watch?v=cdwal5Kw3Fc';


// Variables and such. 
const DiscordTTS = require("discord-tts");

//const config_settings = require('./config.json');


class CMD {
		/*const*/ SILLY_MODE = false;
		/*const*/ ABSOLUTE_MAX_HISTORY_SIZE = 1000; // Math.min this, somehow. 
		/*const*/ ABSOLUTE_MAX_PLAYLIST_SIZE = 255;
		/*const*/ ONE = (this.SILLY_MODE)? MAX_VALUE : 1;

	// Variables and such. 
	TALKING = new Set(); 
	PLAYLIST = [];
	HISTORY = [];
	    PLAYING = false; // Find a better way to do this. 
	COMMANDS = []; // This can REALLY be known at compile time. 
	connection = null;
		LOOP = false;
		LOOP_FRONT = false; 
		VOLUME = 1.0;
		AUTO_PLAY = true;
		DAMP = 0.1;
		MAX_HISTORY_SIZE = 100;
		MAX_PLAYLIST_SIZE = 50;
		LOCK_TO_CHANNEL_ONCE_JOINED = false;
		FADE_TIME = 5000;
		REQUIRE_ROLE_TO_USE = false;

		player = null;
		resource = null;

		BOT_USERS = "everyone";
		REQUIRE_ROLE_FOR_VOLUME = false;
		VOLUME_USERS = "everyone";


	constructor(settings,player){ // <===
		this.player = player;
		  this.resource = createAudioResource(test, {inlineVolume: true});
		console.log("Constructor called.");
		this.COMMANDS = initialize_commands(false);
		Object.assign(this,settings);
	}

	//=====
	/*const */DiscordTTS = require("discord-tts");
	test(interaction) {
		//interaction.channel.send("Hey there!");
		//return "Test function was called.";
		return this.read(interaction.options.getString('thisisjustfortesting'));
	}
	read(string) {
		let stream = DiscordTTS.getVoiceStream(string);
		let audioResource = createAudioResource(stream, {inlineVolume: true});
		this.player.play(audioResource);
		return "Called the test function.";
	}
	//=====

	kick(interaction) { // Delete this? 
		resource = createAudioResource(test, {inlineVolume: true});
		player.play(resource);
		return ('\`*Rattle*\`');
	}
	skip(interaction) {
		// play_front(); // This also works, but I think it's better to leave control of this in the hands of /auto and this.AUTO_PLAY. 
		this.player.stop();
		return ('Skipping.');
	}
	stop(interaction) {
		this.player.pause();
		return ('Paused.');
	}
	resume(interaction) {
		this.player.unpause(); // Use && and fit into a single line instead? 
		return ('Resumed.'); 
	}
	async join(interaction) {
		return this.JOIN(interaction.guildId,interaction.member.voice.channelId,interaction.guild.voiceAdapterCreator);
	}

	async JOIN(guildId,channelId,adapterCreator) {
	//async function join(interaction) {
		//guildId = interaction.guildId;
		//channelId = interaction.member.voice.channelId;
		//adapterCreator = interaction.guild.voiceAdapterCreator;

		this.connection = getVoiceConnection(guildId);
		//this.connection = getVoiceConnection(interaction.guildId);

		if (!this.LOCK_TO_CHANNEL_ONCE_JOINED || !this.connection) {
			this.connection = joinVoiceChannel({
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
			this.connection.subscribe(this.player); // <== 
		}

		try {
			await entersState(this.connection, VoiceConnectionStatus.Ready, 20e3);
			// if ID == bot ID then return, or something. 
			// Ended up not being necessary, bot doesn't register when it starts this.TALKING. 
			// Don't know why but not going to look a gift horse in the mouth for the moment. 
			// Should look into it at a future date though. 
			this.connection.receiver.speaking.on("start", (userId) => {
				//console.log("Someone started talking.")
				this.TALKING.add(`${userId}`)
			});
			this.connection.receiver.speaking.on("end", (userId) => {
				//console.log("Someone stopped talking.")
				this.TALKING.delete(`${userId}`)
			});
			return ('Joined.');
		} catch(error) {
			console.warn(error); // Look into console.warn as compared to console.error. 
			return ('Error in join function.');
		}
	}

	what(interaction) {
		return "Currently playing is: "+this.PLAYLIST[0];
	}
	set(interaction) {
		if (this.REQUIRE_ROLE_FOR_VOLUME && !interaction.member.roles.cache.some(r => r.name === this.VOLUME_USERS)) {
			return "You must have the "+this.VOLUME_USERS+" role to adjust the volume.  It is currently "+this.VOLUME+'.';
		}
		let response = 'Volume was \`'+this.VOLUME+'\`, is '
		this.VOLUME = interaction.options.getNumber('level') / 10.0;
		response = response.concat('now \`'+this.VOLUME+'\`.');
		return response;
	}
	damp(interaction) {
		let response = 'Damp was \`'+this.DAMP+'\`, is '
		this.DAMP = interaction.options.getNumber('damp') / 100.0; // Is 100 appropriate? 
		// Could use this.DAMP = Math.max(this.DAMP, interaction.opt..., but this is more fun! 
		return response.concat('now \`'+this.DAMP+'\`.');
	}
	auto(interaction) {
		this.AUTO_PLAY = !this.AUTO_PLAY;
		return "Auto-play is now "+(this.AUTO_PLAY?"on.":"off."); // The ternary operator isn't professional; just for fun. 
	}
	next(interaction) {
		this.play_front(); // Maybe I should just fold this into `skip`? 
		return "Forcibly playing "+this.PLAYLIST[0]+'.';
	}
	loop(interaction) {
		this.LOOP = !this.LOOP;
		if (this.LOOP) this.LOOP_FRONT = false;
		return "Will "+(this.LOOP?"now":"not")+" loop playlist.";
	}
	keep(interaction) {
		this.LOOP_FRONT = !this.LOOP_FRONT;
		if (this.LOOP_FRONT) this.LOOP = false;
		return "Will "+(this.LOOP_FRONT?"now":"not")+" loop first song.";
	}
	help(interaction) {
		let response = []; // Maybe this funny response and loop thing should be its own function.  That'd be more `LISP`y. 
		for (const command of this.COMMANDS)
			response.push((capitalize(command.name)+": ").padEnd(10).concat(command.description)); // This is kind of messy. 
		return '\`\`\`'+response.join('\n')+'\`\`\`';
	}
	async strike(interaction) {
		let from = interaction.options.getInteger('from');
		let until = interaction.options.getInteger('until');
		//if (until == undefined) until = from; // Fix later.
		if (until >= this.PLAYLIST.length || from < 0)
			return "Index out of bounds.";
		if (until < from)
			return ("Indices backwards, no change.");
		let response = await this.LIST(this.PLAYLIST.slice(from,until+1),from);
		this.PLAYLIST.splice(from,(until - from) + 1);
		return '\`\`\`'+response.join('\n')+'\`\`\`'
		/*
		song_removed = this.PLAYLIST[from]+"`Note to self, have it return all songs deleted by examining the way history works. -- Programmer's note.`";
		let response = [];
		this.LIST(this.PLAYLIST); // <=== //?
		this.PLAYLIST.splice(from,(until - from) + 1);
		return "Removed "+song_removed+" from playlist.";
		*/
	}
	fade(interaction) {
		let response = 'Fade was \`'+this.FADE_TIME+'\`, is '
		this.FADE_TIME = Math.max(interaction.options.getInteger('fade'),this.ONE);
		return response.concat('now \`'+this.FADE_TIME+'\`.');
	}
	pop(interaction) {
		return "Removed "+this.PLAYLIST.pop()+" from playlist.";
	}
	insert(interaction) {
		this.accrue(interaction.options.getString('url'),interactions.options.getInteger('index'));
		return "HEY FIX THIS RETURN STATEMENT.";
	}
	push(interaction) {
		this.accrue(interaction.options.getString('url'),this.PLAYLIST.length);
		return "Appended "+this.PLAYLIST[this.PLAYLIST.length-1]+".";
	}
	jump(interaction) {
		this.accrue(interaction.options.getString('url'),0);
		return "Prepended "+this.PLAYLIST[0]+".";
	}
	play(interaction) {
		//if (!this.connection) 
			this.join(interaction);
		this.PLAYING = false; 
		this.jump(interaction);
		return "Now playing "+this.PLAYLIST[0]+'.';
	}
	// Make this function private. \/ 
	accrue(entry,index){
		//console.log("Called accrue, playing is "+this.PLAYING+".");
		console.log(entry);
		console.log(remove_non_URL_characters(entry).split(' ').slice(0,100));
		console.log(remove_non_URL_characters(entry).split(' ').slice(0,this.MAX_PLAYLIST_SIZE));
		let songs = remove_non_URL_characters(entry).split(' ').slice(0,this.MAX_PLAYLIST_SIZE);
		this.PLAYLIST.splice(index,0,...songs).slice(0,this.MAX_PLAYLIST_SIZE);
		if (!this.PLAYING && this.AUTO_PLAY)
			this.play_front();
		return this.PLAYLIST[0] ?? "YAWNY";
	}

	async history(interaction) {
		let response = await this.LIST(this.HISTORY);
		return (response.length !== 0)? '\`\`\`'+response.join('\n')+'\`\`\`' : "No songs have been played.";
	}
	async list(interaction) {
		let response = await this.LIST(this.PLAYLIST);
		return (response.length !== 0)? '\`\`\`'+response.join('\n')+'\`\`\`' : "Playlist empty.";
	}
	async LIST(list_given,HACK) {
		let response = [];
		HACK = HACK ?? 0;
		for (let i in list_given)
		{
			let song = list_given[i];
			console.log("Song is "+song+'.');
			try {
				let info = await ytdl.getInfo(song);
				let timestamp = get_timestamp(song);
				timestamp = (timestamp > 0? "".concat(new Date(timestamp).toISOString().substring(11,19),"]->[") : "")
				response.push("".concat((Number(i)+HACK),". [",timestamp,new Date(info.videoDetails.lengthSeconds*1000).toISOString().substring(11,19),"]: ",info.videoDetails.title,'.')); 
			} catch (e) {
				// This isn't tripping for some reason, I don't know why. 
				// Because broken promises, investigate at a later date. 
				console.error(e);
				response.push('Invalid song.');
			}
		}
		return response;
	}

	async play_front() {
		console.log('Play_front()');
		if (this.PLAYLIST.length > 0) {
			this.PLAYING = true;
			console.log("Playlist[0] is: "+this.PLAYLIST[0]+".");
			let song = null;
			try {
				song = await PlayDL.stream(this.PLAYLIST[0], {seek: get_timestamp(this.PLAYLIST[0])});
			}
			catch (e) {
				// None of this actually executes; why is that? 
				// Because broken promises, investigate at a later date. 
				console.error(e);
				console.log('Bonk.');
			}
			try {
				this.resource = createAudioResource(song.stream, {inputType : song.type, inlineVolume: true});
			}
			catch (e) {
				cycle();
				return;
			}

			this.HISTORY.unshift(this.PLAYLIST[0]);
			if (this.HISTORY.length > this.MAX_HISTORY_SIZE)
				this.HISTORY.pop();

			//console.log("We just created an audio resource of "+song+".");
			this.player.play(this.resource);

			if (this.LOOP)
				this.PLAYLIST.push(this.PLAYLIST[0]);
			if (this.LOOP_FRONT)
				this.PLAYLIST.unshift(this.PLAYLIST[0]);
		}
		else
			this.PLAYING = false; ///
	}
	cycle(){
		this.PLAYLIST.shift();
		this.PLAYING = false;
		this.play_front();
	}
	dropVolume(){
		this.resource.volume.setVolume(this.DAMP*this.VOLUME); // Set the volume to this.DAMP * this.VOLUME. 
	}
	raiseVolume(fade_time){
		let percentage = Math.min(((this.FADE_TIME - fade_time) / this.FADE_TIME) + this.DAMP, this.ONE);
		//console.log(percentage * this.VOLUME);
		this.resource.volume.setVolume(percentage * this.VOLUME);
	}
}

module.exports = CMD;
