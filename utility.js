exports.initialize_commands = function(initialize) { // Maybe should rename. 
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
		new SlashCommandBuilder().setName('search').setDescription('Searches for a YouTube video and plays the first result.').addStringOption(opt=>opt.setName('query').setDescription('The search terms used.').setRequired(true)),
		new SlashCommandBuilder().setName('test').setDescription('A test function, it should only be used by the developer.  REMOVE ME.').addStringOption(opt=>opt.setName('thisisjustfortesting').setDescription('Test.').setRequired(true)),
		new SlashCommandBuilder().setName('abscond').setDescription('Disconnect bot from voice channel.'),
		new SlashCommandBuilder().setName('drop').setDescription('How much faster it fades out than fades in.').addIntegerOption(option => option.setName('drop').setDescription('The new drop level.').setRequired(true)),
		new SlashCommandBuilder().setName('clear').setDescription('Empties the playlist.'),
		// Use commas. 
	]
		.map(command => command.toJSON());

	// Add functionality to wipe commands.  // TAGYOUIT. 
	// if (wipe_commands) { /* do stuff */ } 
	if (initialize) 
	{
		const { REST } = require('@discordjs/rest');
		const { Routes } = require('discord-api-types/v9');
		const { clientId, guildId, token } = require('./safe.json');
		const rest = new REST({version: '9' }).setToken(token);
		rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
			.then(() => console.log('Registration complete.'))
			.catch(console.error);
	}
	return commands;
}

// Utility functions. 
exports.capitalize = function(string){
	if (typeof string != 'string' || string.length < 1) {
		console.error("Error in `capitalize()`.")
		return string;
	}
	return string.charAt(0).toUpperCase().concat(string.slice(1));
}

// Should this be `async-await`ish? 
exports.affirm = function(conditional, error_msg, interaction){ // Bullying the macroless language into having macros. 
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

exports.remove_non_URL_characters = function(string){
	let legal_characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~:/?#[]@!$&'()*+;="; // , // Comma is deliberately excluded; is that prudent? 
	original_string = string;
	fnl = "";
	for (c of legal_characters)
		string = string.replaceAll(c,' ');
	for (let i=0;i<original_string.length;++i)
		fnl = fnl.concat(string.charAt(i) == ' '? original_string.charAt(i) : ' ');
	return fnl;
}

exports.respond = function(interaction,msg) {
	console.log(msg);
	//console.log(interaction);
	if (interaction != null) {
		//interaction.channel.send(msg);
		//interaction.reply(msg);
		interaction.editReply(msg);
	}
	//interaction.deferReply(msg);
	return;
}

exports.get_timestamp = function(url) {
	return parseInt((/t=(\d+)/.exec(url)??[0,0])[1]);
	// Thanks, `The Great Old One of Javascript`. 
}

exports.array_to_msg = function(response){
	return '\`\`\`'+response.join('\n')+'\`\`\`'
}
