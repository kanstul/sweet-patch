let cmds = new Function();

cmds.someFunction = () => {
		console.log("Hallo, moto.");
}

function main(){
	cmds['someFunction']();
}

cmds();
