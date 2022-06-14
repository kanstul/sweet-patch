const { Client, Intents } = require('discord.js')
const { AudioPlayerStatus, createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
//const { token } = require('./config.json');
const PlayDL = require('play-dl');
const yts = require("yt-search");

const {tts_clientId} = require('./safe.json');

const { initialize_commands, capitalize, remove_non_URL_characters, respond, get_timestamp, array_to_msg } = require('./utility.js')

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
		DROP = 10;


	constructor(settings,player){ // <===
		this.player = player;
		  this.resource = createAudioResource(test, {inlineVolume: true});
		console.log("Constructor called.");
		this.COMMANDS = initialize_commands(false);
		Object.assign(this,settings);
	}

	async search(interaction) {
		const {videos} = await yts(interaction.options.getString('query'));
		if (videos.length === 0)
			return "No videos found."
		else
		{
			//interaction.content = videos[0];
			//return this.jump();
			this.join(interaction);
			this.PLAYLIST.unshift(videos[0].url);
			return this.next(interaction);
		}
	}

	async test(interaction) {
		//let tmp = await PlayDL.video_basic_info('https://www.youtube.com/watch?v=IF6hYIf0Uzs');
		//console.log("Type of `tmp` is "+typeof tmp);
		//console.log(tmp.video_details.title);
		//let tmp = await PlayDL.playlist_info('https://www.youtube.com/watch?v=H5v3kku4y6Q&list=PLMC9KNkIncKseYxDN2niH6glGRWKsLtde');
		//tmp = await PlayDL.playlist_info('https://www.youtube.com/watch?v=H5v3kku4y6Q');
		//song = await PlayDL.stream(this.PLAYLIST[0], {seek: get_timestamp(this.PLAYLIST[0])});
		//console.log(tmp);
//let answer = '\`\`\`0. [00:01:39]: Damask Roses: Roger Quilter. \n1. [00:01:54]: Rachmaninoff: Oh stay, my love, forsake me not. \n2. [00:02:16]: Rachmaninoff: Child, You Are Beautiful Like a Flower, Op.8, No.2. \n3. [00:01:40]: Seven Elizabethan Lyrics: III. Damask Roses. \n4. [00:01:39]: Damask Roses: Roger Quilter. \n5. [00:01:54]: Rachmaninoff: Oh stay, my love, forsake me not. \n6. [00:02:16]: Rachmaninoff: Child, You Are Beautiful Like a Flower, Op.8, No.2. \n7. [00:01:40]: Seven Elizabethan Lyrics: III. Damask Roses.\`\`\`'
		//return answer;

		return "Called the test function.";

	}

	/*=====
	const DiscordTTS = require("discord-tts");
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
	*///=====

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
	/*
	async join(interaction) {
		return this.JOIN(interaction.guildId,interaction.member.voice.channelId,interaction.guild.voiceAdapterCreator);
	}
	*/
	async join(interaction) {
		let guildId = interaction.guildId;
		let channelId = interaction.member.voice.channelId;
		let adapterCreator = interaction.guild.voiceAdapterCreator;

		this.connection = getVoiceConnection(guildId);

		if (!this.LOCK_TO_CHANNEL_ONCE_JOINED || !this.connection) {
			this.connection = joinVoiceChannel({
				channelId: channelId,
				guildId: guildId,
				adapterCreator: adapterCreator,
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
				if (userId != tts_clientId) // Consider.
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
		return "Currently playing is: "+this.PLAYLIST[0]+'.';
	}
	set(interaction) {
		if (this.REQUIRE_ROLE_FOR_VOLUME && !interaction.member.roles.cache.some(r => r.name === this.VOLUME_USERS)) {
			return "You must have the "+this.VOLUME_USERS+" role to adjust the volume.  It is currently "+this.VOLUME+'.';
		}
		let response = 'Volume was \`'+this.VOLUME+'\`, is '
		this.VOLUME = interaction.options.getNumber('level') / 10.0;
		return response.concat('now \`'+this.VOLUME+'\`.');
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
		//return '\`\`\`'+response.join('\n')+'\`\`\`'
		return array_to_msg(response);
	}
	fade(interaction) {
		let response = 'Fade was \`'+this.FADE_TIME+'\`, is '
		this.FADE_TIME = Math.max(interaction.options.getInteger('fade'),this.ONE+1);
		return response.concat('now \`'+this.FADE_TIME+'\`.');
	}
	drop(interaction) {
		let old_drop = this.DROP;
		this.DROP = interaction.options.getInteger('drop');
		return "Player will now fade out `"+this.DROP+"x` faster than it fades in, was `"+old_drop+"x`.";
	}
	pop(interaction) {
		return "Removed "+this.PLAYLIST.pop()+" from playlist.";
	}
	async insert(interaction) {
		let index = interaction.options.getInteger('index');
		let len = this.accrue(interaction.options.getString('url'),index);
		let response = await(this.LIST(this.PLAYLIST.slice(index,index+len),index));
		return array_to_msg(response);
	}
	push(interaction) {
		this.accrue(interaction.options.getString('url'),this.PLAYLIST.length);
		return "Appended "+this.PLAYLIST[this.PLAYLIST.length-1]+'.';
	}
	jump(interaction) {
		this.accrue(interaction.options.getString('url'),0);
		return "Prepended "+this.PLAYLIST[0]+'.';
	}
	play(interaction) {
		//if (!this.connection) 
			this.join(interaction);
		this.PLAYING = false; 
		this.jump(interaction);
		return "Now playing "+this.PLAYLIST[0]+'.';
	}
	// Make this function private \/. 
	accrue(entry,index){
		let songs = remove_non_URL_characters(entry).split(' ').slice(0,this.MAX_PLAYLIST_SIZE);
		this.PLAYLIST.splice(index,0,...songs).slice(0,this.MAX_PLAYLIST_SIZE);
		if (!this.PLAYING && this.AUTO_PLAY)
			this.play_front();
		//return this.PLAYLIST[0] ?? "YAWNY";
		return Number(songs.length); // Is this really the best way to get insert working? 
	}
	async history(interaction) {
		let response = await this.LIST(this.HISTORY);
		return (response.length !== 0)? '\`\`\`'+response.join('\n')+'\`\`\`' : "No songs have been played.";
	}
	async list(interaction) {
		let response = await this.LIST(this.PLAYLIST);
		console.log("Attempting to return the message from `list`.  It is as follows.");
		console.log(response);
		return (response.length !== 0)? array_to_msg(response) : "Playlist empty.";
		//return (response.length !== 0)? '\`\`\`'+response.join('\n')+'\`\`\`' : "Playlist empty.";
	}
	async LIST(list_given,HACK) {
		let response = [];
		HACK = HACK ?? 0;
		const pad = Math.log10(list_given.length) + 3;
		for (let i in list_given)
		{
			let song = list_given[i];
			console.log("Song is "+song+'.');
			try {
				let info = (await PlayDL.video_basic_info(song)).video_details;
				let timestamp = get_timestamp(song);
				timestamp = (timestamp > 0? "".concat(new Date(timestamp).toISOString().substring(11,19),"]->[") : "")
				//response.push("".concat(((Number(i)+HACK)+".").padEnd(5),"[", timestamp, new Date(info.durationInSec*1000).toISOString().substring(11,19),"]: ",info.title,'.')); 
				response.push(((Number(i)+HACK)+".").padEnd(pad,' ').concat("[", timestamp, new Date(info.durationInSec*1000).toISOString().substring(11,19),"]: ",info.title,'.'));
				//response.push(info.title);
			} catch (e) {
				// This isn't tripping for some reason, I don't know why. 
				// Because broken promises, investigate at a later date. 
				console.error(e);
				response.push('Invalid song.');
			}
			///response.push(list_given[i]);
		}
		return response;
	}

	async play_front() { // Rename to `next`? 
		// Do a `let variable = this.PLAYLIST[0];` to make this a bit cleaner? 
		console.log('Play_front()');
		if (this.PLAYLIST.length > 0) {
			this.PLAYING = true;
			console.log("Playlist[0] is: "+this.PLAYLIST[0]+".");
			let song = null;
			try {
				try {
					console.log("Delete this message.");
					let tmp = await PlayDL.playlist_info(this.PLAYLIST[0]);
					this.PLAYLIST.shift();
					for (const video of tmp.fetched_videos.values())
					{
						for (let i=video.length-1;i>=0;--i){
							this.PLAYLIST.unshift(video[i].url);
							//console.log(video[i].url);
						}
					}
				}
				catch {
					console.log("Not a playlist.") //FINDABETTERWAY.
				}
				finally {
					//console.log("Current playlist is as follows.");
					//console.log(this.PLAYLIST);
					//console.log("Timestamp is "+get_timestamp(this.PLAYLIST[0])+'.');
					song = await PlayDL.stream(this.PLAYLIST[0], {seek: get_timestamp(this.PLAYLIST[0])});
				}
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
				this.cycle();
				return;
			}

			this.HISTORY.unshift(this.PLAYLIST[0]);
			if (this.HISTORY.length > this.MAX_HISTORY_SIZE)
				this.HISTORY.pop();

			//console.log("We just created an audio resource of "+song+".");
			this.player.play(this.resource);

		}
		else
			this.PLAYING = false; ///
	}
	cycle(){
		if (this.LOOP)
			this.PLAYLIST.push(this.PLAYLIST[0]);
		else if (this.LOOP_FRONT)
			this.PLAYLIST.unshift(this.PLAYLIST[0]);
		this.PLAYLIST.shift();
		this.PLAYING = false;
		if (this.AUTO_PLAY)
			this.play_front();
	}
//	dropVolume(){
//		this.resource.volume.setVolume(this.DAMP*this.VOLUME); // Set the volume to this.DAMP * this.VOLUME. 
//	}
	setVolume(fade_time){
		let percentage = /*Math.max*/(Math.min((((this.FADE_TIME - fade_time) / this.FADE_TIME) + this.DAMP), this.ONE)/*,this.FADE_TIME*/); //!!
		//console.log(percentage * this.VOLUME);
		this.resource.volume.setVolume(percentage * this.VOLUME);
	}
	abscond(interaction){
		this.connection.destroy();
		return "Disconnected from voice channel.";
	}
	clear(interaction){
		this.PLAYLIST.splice(this.PLAYING?1:0,this.PLAYLIST.length);
		return "Cleared the playlist.";
	}
}

module.exports = CMD;
