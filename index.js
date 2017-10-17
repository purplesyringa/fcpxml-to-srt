let url = require("url");
let path = require("path");
let electron = require("electron");

electron.app.on("ready", () => {
	let win = new electron.BrowserWindow({
		width: 800,
		height: 600
	});
	win.setMenu(null);

	win.loadURL(url.format({
		pathname: path.join(__dirname, "index.html"),
		protocol: "file:",
		slashes: true
	}));

	win.on("closed", () => {
		electron.app.quit();
	});
});