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

class Songish {
	url;
	title;
	duration;
	startt; // Start time. 
	constructor(url,startt){
		this.url = url;
		this.startt = startt ?? get_timestamp(url) // ?? 0;
	}
	async init (){
		let info = (await PlayDL.video_basic_info(this.url)).video_details;
		this.title = info.title;
		this.duration = info.durationInSec;
	}
	static async create(url,startt){
		if (!Songish.isValidURL(url))
			return null;
		try {
			const This = new Songish(url,startt);
			await This.init(); /// Need this be `await`?  I think it must. 
			return This;
		}
		catch (e) { /// This catch block shouldn't ever execute since the earlier `if` should catch everything; but just in case. 
			console.error("Catch block in Songish tripped.");
			console.error(e);
			console.error("Catch block in Songish tripped.");
			return null;
		}
	}
	static isValidURL(url) { /// Move to `utility`? 
		return url.startsWith('https') && PlayDL.yt_validate(url) === 'video';
	}
}

//const config_settings = require('./config.json');
class CMD {
	// This comment no longe relevant.  // Capitalized functions are internal, as if they were private. 

	// Constants. 
	 SILLY_MODE = false;
	 ABSOLUTE_MAX_HISTORY_SIZE = 1000; // Math.min this, somehow. 
	 ABSOLUTE_MAX_PLAYLIST_SIZE = 255;
	 ONE = (this.SILLY_MODE)? MAX_VALUE : 1;

	// Variables necessary to function. 
	TALKING = new Set(); 
	PLAYLIST = [];
	HISTORY = [];
	COMMANDS = []; // This can REALLY be known at compile time. 
	    PLAYING = false; // Find a better way to do this. 
	JUST_SKIPPED = false;
	TIMESTAMP = 0;
	 INFO = new Map(); // Name better? 
	connection = null;
	player = null;
	resource = null;

	// Settings. 
	LOOP = false;
	LOOP_FRONT = false; 
	VOLUME = 1.0;
	AUTO_PLAY = true;
	DAMP = 0.1;
	FADE_TIME = 5000;
	DROP = 10;
	DEBOUNCE = 50;
	MAX_HISTORY_SIZE = 100;
	MAX_PLAYLIST_SIZE = 50;
	LOCK_TO_CHANNEL_ONCE_JOINED = false;
	REQUIRE_ROLE_TO_USE = false;
	BOT_USERS = "everyone";
	REQUIRE_ROLE_FOR_VOLUME = false;
	VOLUME_USERS = "everyone";
	DAMP_FOR_AMAI = false;
		HACK = 0; //,

	constructor(settings,player){ // <===
		this.player = player;
		  this.resource = createAudioResource(test, {inlineVolume: true});
		console.log("Constructor called.");
		this.COMMANDS = initialize_commands(false);
		Object.assign(this,settings);
		const SECONDS_BETWEEN_GARBAGE_COLLECTIONS = 5000;
		let counter = 0;
		setInterval( ()=> {
			this.ResolveINFO();
		},SECONDS_BETWEEN_GARBAGE_COLLECTIONS);// The amount of milliseconds it waits between laboriously iterating over every single element of the map, resolving promises so that we can save a lot of time when `LIST` is called.
	}

	async search(interaction) {
		const {videos} = await yts(interaction.options.getString('query'));
		if (videos.length === 0)
			return "No videos found."
		else
		{
			////interaction.content = 'Hahahahah.';
			return await this.play(interaction,videos[0].url);
			/*
			this.join(interaction);
			this.PLAYLIST.unshift(videos[0].url); // Could make this give a choice of three videos like that other bot from forever ago did. 
			return this.next(interaction);
			*/
		}
	}

	async test(interaction) {
		console.log(this.INFO);
		return "Called the test function.";
	}

	async ResolveINFO() { // This is more or less a garbage collector. 
		for (const key of this.INFO.keys()) {
			//console.log("The URL was "+this.INFO.get(key).url);
			this.INFO.set(key,await this.INFO.get(key));
			//console.log("The URL is "+this.INFO.get(key).url);
			if (!this.PLAYLIST.includes(key) && !this.HISTORY.includes(key))
				this.INFO.delete(key);
		}
		return "Resolved.";
	}

	fastforward(interaction) {
		return "Fast-forwarding to `"+this.Wind(interaction.options.getInteger('seconds'))+"` seconds.";
	}

	rewind(interaction) {
		return "Rewinding to `"+this.Wind(-interaction.options.getInteger('seconds'))+"` seconds.";
	}

	Wind(seconds) {
		// This function exploits the screwy way in which get_timestamp works! 
		//return parseInt((/t=(\d+)/.exec(url)??[0,0])[1]);
		let fnl = this.TIMESTAMP/1000 + seconds;
		console.log("In wind, PLAYLIST[0] is "+this.PLAYLIST[0]+'.');
		this.PLAYLIST[0] = this.PLAYLIST[0].concat("?t=",Math.floor((this.TIMESTAMP/1000)+seconds)); // Do we actually need the `Math.floor`?  // Doofopoly.  (Not really). 
		console.log("In wind, just shoved "+this.PLAYLIST[0]+" on, let's see how that goes.");
		this.play_front();
		//this.skip();
		return fnl;
	}

//	read(string) {
//	Cool name. 
//	}

	kick(interaction) { // Delete this? 
		let resource = createAudioResource(test, {inlineVolume: true});
		this.player.play(resource);
		console.log("Rattle.");
		return ('\`*Rattle*\`');
	}
	skip(interaction) {
		this.JUST_SKIPPED = true; // Doofopoly. 
		this.player.stop();
		return ('Skipping.');
	}
	//stop(interaction) {
	pause(interaction) {
		this.player.pause();
		return ('Paused.');
	}
	resume(interaction) {
		this.player.unpause(); // Use && and fit into a single line instead? 
		return ('Resumed.'); 
	}
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
		

		/*
		//console.log(this.connection);
		if (this.connection == null)
			return "You are not in a voice channel.";
			*/ //,

		try {
			await entersState(this.connection, VoiceConnectionStatus.Ready, 20e3);
			// if ID == bot ID then return, or something. 
			// Ended up not being necessary, bot doesn't register when it starts this.TALKING. 
			// Don't know why but not going to look a gift horse in the mouth for the moment. 
			// Should look into it at a future date though. 
			this.connection.receiver.speaking.on("start", (userId) => {
				//console.log("Someone started talking.")
				if (this.DAMP_FOR_AMAI || userId != tts_clientId)
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
			response.push((capitalize(command.name)+": ").padEnd(14).concat(command.description)); // This is kind of messy. 
		return array_to_msg(response);
	}
	async strike(interaction) {
		let from = interaction.options.getInteger('from');
		let until = interaction.options.getInteger('until');
		//if (until == undefined) until = from; // Fix later.
		if (until > this.PLAYLIST.length || from < 0)
			return "Index out of bounds.";
		if (until < from)
			return ("Indices backwards, no change.");
		let response = await this.LIST(this.PLAYLIST.slice(from,until+1),from);
		this.PLAYLIST.splice(from,(until - from) + 1);
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
	
//	Insert(string, index){
//		index = index ?? 0; /// Do we need this line, or will it just default to zero? 
//		let songs = this.String_to_songs(string);
//		this.PLAYLIST.splice(index,0,...songs);
//		Sanctify();
//		return Math.max (index+songs.length, MAX_PLAYLIST_SIZE); // Index of last song inserted. 
//	}
//	Sanctify(){
//		// Make sure that the playlist isn't too long. 
//		return;
//	}
//	async String_to_songs(string){
//		let urls = remove_non_URL_characters(string).split(' ');
//		let songs = [];
//		for (let url of urls) { /// We could make the `await` only trigger if a boolean we pass in the function call is true. 
//			//let song = Song.create(url);
//			let song = new Song(url);
//			if (song.valid)
//				songs.push(song);
//			//if (Song.isValidURL(url))
//				//songs.push(/*await*/ Song.create(url));
//			//else continue;
//		}
//		//songs = (await Promise.all(songs)).filter(o => o != null); // Thank you, TGOOOJ! 
//		return songs;//.slice(0,this.MAX_PLAYLIST_SIZE); ? 
//	}
	async push(interaction) {
		return this.INSERT(interaction,this.PLAYLIST.length);
	}
	async jump(interaction) {
		// Make this actually return right.  // Doofopoly. 
		if (PLAYING)
			return this.INSERT(interaction,1);
		else
			return this.INSERT(interaction,0);
	}
	async insert(interaction) {
		let index = interaction.options.getInteger('index');
		if (index < 0 || index > this.PLAYLIST.length) // Doofopoly. 
			return "Index out of bounds."; 
		return this.INSERT(interaction,interaction.options.getInteger('index'));
	}
	async INSERT(interaction,index) {
		let len = await this.accrue(interaction.options.getString('url'),index); /// If this isn't `await` then `play` is super liable to return `undefined`. 
		let response = await(this.LIST(this.PLAYLIST.slice(index,index+len),index));
		return array_to_msg(response);
	}
	async accrue(entry,index){
		let songs = remove_non_URL_characters(entry).split(' ').slice(0,this.MAX_PLAYLIST_SIZE);
		let deplaylisted_songs = [];
		for (let song of songs) {
			if (song.startsWith('https') && PlayDL.yt_validate(song) === 'playlist') {
				let tmp = await PlayDL.playlist_info(song);
				tmp = await tmp.all_videos();
				for (let i=(parseInt((/index=(\d+)/.exec(song)??[1,1])[1]) - 1);i<tmp.length && i < this.MAX_PLAYLIST_SIZE;++i) {
					console.log("Calling Songish.create() with "+tmp[i].url+', which is of type '+typeof tmp[i].url + '.');
					let info = /*await*/ Songish.create(tmp[i].url);
					if (Songish.isValidURL(tmp[i].url))
						this.INFO.set(tmp[i].url,info);
					deplaylisted_songs.push(tmp[i].url);
				}
			}
			else {
				let info = /*await*/ Songish.create(song);
				if (Songish.isValidURL(song))
					this.INFO.set(song,info);
				deplaylisted_songs.push(song);
			}
		}
		this.PLAYLIST.splice(index,0,...deplaylisted_songs).slice(0,this.MAX_PLAYLIST_SIZE);
		if ((!this.PLAYING && this.AUTO_PLAY) || this.JUST_SKIPPED){ // Doofopoly. 
			this.JUST_SKIPPED = false;
			this.play_front();
		}
		return Number(songs.length); // Is this really the best way to get insert working?  YAWNY. 
	}
	async play(interaction,_video_) {
		console.log("Play was called, video was "+_video_+'.');
		//if (!this.connection) 
			this.join(interaction);
		this.PLAYING = false; 
		this.JUST_SKIPPED = true; // Doofopoly. 
		if (_video_ != undefined) 
			await this.accrue(_video_,0);
		else
			await this.INSERT(interaction,0);
		
		/// Learn to use promises! 
		//console.log(this.PLAYLIST);
		interaction.editReply("AMAI "+(await this.INFO.get(this.PLAYLIST[0])).title);
		return "Now playing "+this.PLAYLIST[0]+'.';
	}
	// Make this function private \/. 
	async history(interaction) {
		let response = await this.LIST(this.HISTORY);
		return (response.length !== 0)? array_to_msg(response) : "No songs have been played.";
	}
	async list(interaction) {
		let response = await this.LIST(this.PLAYLIST);
		return (response.length !== 0)? array_to_msg(response) : "Playlist empty.";
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
				//let info = (await PlayDL.video_basic_info(song)).video_details;
				let timestamp = get_timestamp(song);
				timestamp = (timestamp > 0? "".concat(new Date(timestamp*1000).toISOString().substring(11,19),"]->[") : "")
				let info = await this.INFO.get(song);
				response.push(((Number(i)+HACK)+".").padEnd(pad,' ').concat("[", timestamp, new Date(info.duration*1000).toISOString().substring(11,19),"]: ",info.title,'.'));
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

	async play_front() { // Rename to `next`?  // TAGTAG. 

		this.JUST_SKIPPED = false // Doofopoly. 

		// Do a `let variable = this.PLAYLIST[0];` to make this a bit cleaner? 
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
				console.log("Wasn't a valid song, can not play.");
				console.log("Wasn't a valid song, can not play.");
				console.log("Wasn't a valid song, can not play.");
				this.cycle();
				return;
			}

			this.HISTORY.unshift(this.PLAYLIST[0]);
			if (this.HISTORY.length > this.MAX_HISTORY_SIZE)
				this.HISTORY.pop();

			//console.log("We just created an audio resource of "+song+".");
			await this.player.play(this.resource);
			//this.TIMESTAMP = get_timestamp(this.PLAYLIST[0]) //, There are better ways we could do this, probably. 
			this.HACK = get_timestamp(this.PLAYLIST[0]);

		}
		else
			this.PLAYING = false; ///
	}
	cycle(){
		console.log("Cycle was called.");
		//console.log("At the start of cycle(), playlist is "+this.PLAYLIST+'.');
		if (this.LOOP)
			this.PLAYLIST.push(this.PLAYLIST[0]);
		else if (this.LOOP_FRONT)
			this.PLAYLIST.unshift(this.PLAYLIST[0]);
		//console.log("Playlist is "+this.PLAYLIST+'.');
		//console.log("PLAYLIST IS "+this.PLAYLIST+'.');
		this.PLAYLIST.shift();
		this.PLAYING = false;
		if (this.AUTO_PLAY || this.JUST_SKIPPED) { // Doofopoly. 
			this.JUST_SKIPPED = false;
			this.play_front();
		}
	}
	setVolume(fade_time){
		fade_time = Math.min(fade_time,this.FADE_TIME); // Is this line really necessary? 
		//console.log("Fade time given is "+fade_time+'.');
		let percentage = Math.min((((this.FADE_TIME - fade_time) / this.FADE_TIME) + this.DAMP), this.ONE);
		//console.log(percentage * this.VOLUME);
		this.resource.volume.setVolume(percentage * this.VOLUME);
		//console.log("Playing at "+percentage*this.VOLUME);
		if (this.PLAYING)
			++this.TIMESTAMP;
		else
			this.TIMESTAMP = this.HACK;
	}
	abscond(interaction){
		this.connection.destroy();
		return "Disconnected from voice channel.";
	}
	clear(interaction){
		this.PLAYLIST.splice(this.PLAYING?1:0,this.PLAYLIST.length);
		return "Cleared the playlist.";
	}
	debounce(interaction){
		return "Debounce was "+this.DEBOUNCE+", is now "+(this.DEBOUNCE = Math.max(0,interaction.options.getInteger('debounce')))+'.';
	}
	timestamp(interaction){
		return "It has been `"+this.TIMESTAMP/1000+"` seconds since this song started playing.";
	}
	ttsdamp(interaction){
		return "Player will "+((this.DAMP_FOR_AMAI = !this.DAMP_FOR_AMAI)?"now":"not")+" dampen when Amai speaks.";
	}
}

module.exports = CMD;
