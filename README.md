# sweet-patch
A Discord music bot expected to run off a personal computer

This exists because I couldn't find a music bot that automatically reduced its volume when people begin speaking, so I made one. 

You can feed it playlists or timestamped videos and it'll destructure the playlist or start from the given timestamp. 

`Use instructions`. 

Make sure you have a version of `node` later then 16.6 installed. 

Rename `safe.json.bak` to `safe.json` and fill out the appropriate fields accordingly. 

Then just type `make` and install dependencies as it screams about them. 

Type `/help` for an overview of all commands. 

`Text to speech`.

You'll need two bots if you want text-to-speech to work, adjust `tts_token` and `tts_clientId` accordingly. 

If you want to enable text-to-speech features, type `node amai.js` *after* `make`, in another terminal. 

Set `PEDANTIC_AMAI` in `config.json` to false if you want it to read every single statement the bot issues. 

.


If you're not on Linux probably the easiest way would be to just launch a virtual machine and start the bot from that.  `Mint` is always okay. 

.

Have fun and smile. 
