// ~/Movies/scene46-Vectrex.fcpxml

let xml2js = require("xml2js");
let prompt = require("text-prompt");
let fs = require("fs");
let untildify = require("untildify");

let frameDuration;
let list = [];

function time(s) {
	return eval(s.replace("s", ""));
}
function pad(s, count) {
	return "0".repeat(count - s.toString().length) + s;
}
function timecode(s) {
	s = Math.round(s / frameDuration) * frameDuration;

	let hours = Math.floor(s / 60 / 60);
	let minutes = Math.floor(s / 60) % 60;
	let seconds = Math.floor(s) % 60;
	let ms = Math.floor(s * 1000) % 1000;

	return pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "," + pad(ms, 3);
}

function walk(name, root, parent) {
	if(name == "marker" && root.$) {
		list.push({
			start: time(root.$.start) - time(parent.$.start),
			end: 0,
			value: root.$.value
		});
	} else if(name == "chapter-marker" && root.$) {
		list.push({
			start: time(root.$.start) - time(parent.$.start),
			duration: time(root.$.posterOffset),
			value: root.$.value
		});
	}

	if(root instanceof Array) {
		root.forEach(entry => {
			walk(name, entry, parent);
		});
	} else if(typeof root == "object") {
		Object.entries(root).forEach(entry => {
			if(entry[0] == "$") {
				return;
			}

			walk(entry[0], entry[1], root);
		});
	}
}

prompt("FCPXML file?")
	.on("submit", fcpXmlFile => {
		fs.readFile(untildify(fcpXmlFile), {encoding: "utf8"}, (e, data) => {
			if(e) {
				process.stderr.write("Error\n");
				process.stderr.write(e.toString() + "\n");
				return;
			}

			xml2js.parseString(data, (e, xml) => {
				if(e) {
					process.stderr.write("Error\n");
					process.stderr.write(e.toString() + "\n");
					return;
				}

				frameDuration = time(xml.fcpxml.resources[0].format[0].$.frameDuration);
				duration = time(xml.fcpxml.library[0].event[0].project[0].sequence[0].$.duration);

				process.stderr.write("Frame duration: " + frameDuration + " seconds\n");
				process.stderr.write("Video duration: " + duration + " seconds\n");
				walk("", xml);
				process.stderr.write("Subtitles gathered: " + list.length + "\n");

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
					list[list.length - 1].end = min(list[list.length - 1].start + list[list.length - 1].duration, duration + 3600);
				} else {
					list[list.length - 1].end = duration + 3600;
				}

				list.slice(0, 5).forEach(subtitle => {
					process.stderr.write(timecode(subtitle.start) + " | " + subtitle.value + "\n");
				});
				process.stderr.write("...\n");

				prompt("Is it ok? (yes)")
					.on("submit", res => {
						if(res != "yes" && res != "") {
							process.stderr.write("Aborting task\n");
							return;
						}

						prompt("SRT file? (stdout)")
							.on("submit", srtFile => {
								let res = "";
								list.forEach((subtitle, i) => {
									res += (i + 1) + "\n";
									res += timecode(subtitle.start) + " --> " + timecode(subtitle.end) + "\n";
									res += subtitle.value + "\n";
									res += "\n";
								});

								if(srtFile) {
									fs.writeFile(untildify(srtFile), res, {encoding: "utf8"}, e => {
										if(e) {
											process.stderr.write("Error\n");
											process.stderr.write(e.toString() + "\n");
											return;
										}

										process.stderr.write("OK\n");
									});
								} else {
									process.stdout.write(res);
								}
							});
					});
			});
		});
	});