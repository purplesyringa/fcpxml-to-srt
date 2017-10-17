let api = require("./api.js");
let prompt = require("text-prompt");
let fs = require("fs");
let untildify = require("untildify");

prompt("FCPXML file?")
	.on("submit", fcpXmlFile => {
		prompt("SRT file?")
			.on("submit", srtFile => {
				api(untildify(fcpXmlFile), untildify(srtFile))
					.then(() => {
						process.stdout.write("File saved\n");
						process.exit(0);
					}, e => {
						process.stderr.write("Error\n");
						process.stderr.write(e.toString() + "\n");
						process.exit(1);
					});
			});
	});