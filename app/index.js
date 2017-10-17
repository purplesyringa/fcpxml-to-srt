let electron = require("electron");

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

dragndrop.ondrop = e => {
	e.preventDefault();

	if(e.dataTransfer.files.length == 0) {
		return;
	}

	let fs = require("fs");
	let api = require("../api.js");

	let files = Array.from(e.dataTransfer.files);

	let promises = files.map(file => {
		let fcpXmlPath = file.path;
		let srtPath = file.path.lastIndexOf("/") < file.path.lastIndexOf(".") ? file.path.replace(/\.(.*?)$/, ".srt") : file.path + ".srt";

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
							let index = files.indexOf(file);
							if(index > -1) {
								files.splice(index, 1);
							}

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

					let index = files.indexOf(file);
					if(index > -1) {
						files.splice(index, 1);
					}
				});
			});
	});

	Promise.all(promises).then(() => {
		if(files.length) {
			electron.remote.dialog.showMessageBox({
				type: "info",
				buttons: ["OK"],
				defaultId: 0,
				title: "FCPXML to SRT",
				message: files.length + " " + (files.length == 1 ? "file was" : "files were") + " created.",
				cancelId: 0
			});
		}
	});
};