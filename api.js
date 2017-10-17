let xml2js = require("xml2js");
let fs = require("fs");

let frameDuration;
let list = [];

function time(s) {
	// 1/2s => 0.5
	return eval(s.replace("s", ""));
}
function pad(s, count) {
	// Pad with zeroes
	return "0".repeat(count - s.toString().length) + s;
}
function timecode(s) {
	// Bind to frames
	s = Math.round(s / frameDuration) * frameDuration;

	// Separate
	let hours = Math.floor(s / 60 / 60);
	let minutes = Math.floor(s / 60) % 60;
	let seconds = Math.floor(s) % 60;
	let ms = Math.floor(s * 1000) % 1000;

	return pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "," + pad(ms, 3);
}

function walk(name, root, parent) {
	if(name == "marker" && root.$) {
		// Add <marker>s with zero duration (it is not given)
		list.push({
			start: time(root.$.start) - time(parent.$.start),
			duration: 0,
			value: root.$.value
		});
	} else if(name == "chapter-marker" && root.$) {
		// Get <chapter-marker> duration from posterOffset
		list.push({
			start: time(root.$.start) - time(parent.$.start),
			duration: time(root.$.posterOffset),
			value: root.$.value
		});
	}

	// Walk recursively
	if(root instanceof Array) {
		root.forEach(entry => {
			walk(name, entry, parent);
		});
	} else if(typeof root == "object") {
		Object.keys(root).forEach(name => {
			if(name == "$") {
				return;
			}

			walk(name, root[name], root);
		});
	}
}

module.exports = (fcpXmlFile, srtFile) => {
	return new Promise((resolve, reject) => {
		fs.readFile(fcpXmlFile, {encoding: "utf8"}, (e, data) => {
			if(e) {
				reject(e);
				return;
			}

			// Parse FCPXML file
			xml2js.parseString(data, (e, xml) => {
				if(e) {
					reject(e);
					return;
				}

				frameDuration = time(xml.fcpxml.resources[0].format[0].$.frameDuration);
				duration = time(xml.fcpxml.library[0].event[0].project[0].sequence[0].$.duration);

				walk("", xml);

				// Sort and set end points
				list.sort((a, b) => {
					return a.start - b.start;
				});

				for(let i = 0; i < list.length - 1; i++) {
					if(list[i].duration) {
						list[i].end = Math.min(list[i].start + list[i].duration, list[i + 1].start);
						continue;
					}

					list[i].end = list[i + 1].start;
				}

				if(list[list.length - 1].duration) {
					list[list.length - 1].end = Math.min(list[list.length - 1].start + list[list.length - 1].duration, duration + 3600);
				} else {
					list[list.length - 1].end = duration + 3600;
				}

				// Output
				let res = "";
				list.forEach((subtitle, i) => {
					res += (i + 1) + "\n";
					res += timecode(subtitle.start) + " --> " + timecode(subtitle.end) + "\n";
					res += subtitle.value + "\n";
					res += "\n";
				});

				fs.writeFile(srtFile, res, {encoding: "utf8"}, e => {
					if(e) {
						reject(e);
						return;
					}

					resolve(true);
				});
			});
		});
	});
};