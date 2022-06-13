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
	interaction.reply(msg);
	return;
}

exports.get_timestamp = function(url) {
	return parseInt((/t=(\d+)/.exec(url)??[0,0])[1]);
	// Thanks, `The Great Old One of Javascript`. 
}

