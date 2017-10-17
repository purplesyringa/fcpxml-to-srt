let electron = require("electron");
let fs = require("fs");
let api = require("../api.js");

let dragndrop = document.getElementById("dragndrop");

document.body.ondragover = e => {
	e.preventDefault();
};
document.body.ondragenter = e => {
	e.preventDefault();
};
document.body.ondragleave = e => {
	e.preventDefault();
};

function handle(fcpXmlPath) {
	let srtPath = fcpXmlPath.lastIndexOf("/") < fcpXmlPath.lastIndexOf(".") ? fcpXmlPath.replace(/\.(.*?)$/, ".srt") : fcpXmlPath + ".srt";

	return new Promise((resolve, reject) => {
		fs.stat(srtPath, (e, stats) => {
			if(!e) {
				electron.remote.dialog.showMessageBox({
					type: "warning",
					buttons: ["No", "Yes"],
					defaultId: 0,
					title: "FCPXML to SRT",
					message: "File " + srtPath + " already exists. Would you like to overwrite it?",
					cancelId: 0
				}, response => {
					if(response == 1) {
						resolve(api(fcpXmlPath, srtPath));
					} else {
						resolve(false);
					}
				});
				return;
			}

			resolve(api(fcpXmlPath, srtPath));
		});
	})
		.catch(e => {
			return new Promise((resolve, reject) => {
				electron.remote.dialog.showMessageBox({
					type: "error",
					buttons: ["OK"],
					defaultId: 0,
					title: "FCPXML to SRT",
					message: e.message,
					cancelId: 0
				}, response => {
					resolve(false);
				});
			});
		});
}

dragndrop.ondrop = e => {
	e.preventDefault();

	if(e.dataTransfer.files.length == 0) {
		return;
	}

	let files = Array.from(e.dataTransfer.files);
	let list = [];

	Promise.all(
		files.map(file => {
			return handle(file.path)
				.then(res => {
					if(res) {
						list.push(file.path);
					}
				});
		})
	).then(() => {
		if(list.length) {
			electron.remote.dialog.showMessageBox({
				type: "info",
				buttons: ["OK"],
				defaultId: 0,
				title: "FCPXML to SRT",
				message: list.length + " " + (list.length == 1 ? "file was" : "files were") + " created.",
				cancelId: 0
			});
		}
	});
};