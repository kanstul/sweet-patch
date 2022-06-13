const { Client, Intents } = require('discord.js')

const {tts_token} = require('./safe.json');

const client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_MESSAGES
	],
});
client.once('ready', ()=> {
	console.log('Ready!');
});
client.on('messageCreate', ()=> {
	console.log('Message.');
});

client.login(tts_token);
