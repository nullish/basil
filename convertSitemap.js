const { rejects } = require('assert');
const fs = require('fs');
const { resolve } = require('path');
const parser = require('xml2json');

const convertSitemap = async () => {
	/**
	 * @function Convert sitemamp
	 * Convert XML sitemap file to JSON 
	 */

	const dataStream = "./input/sitemap.xml";
	const outputPath = "./input/sitemap.json";
	const outStream = fs.createWriteStream(
		outputPath,
		{ flags: "a" } // appends data
	);

	const xmlSiteMap = fs.readFileSync(dataStream);

	const jsonSiteMap = parser.toJson(xmlSiteMap);
	const json = JSON.parse(jsonSiteMap);
	const urls = json.urlset.url;

	// Remove existing JSON file if present
	// delete a file asynchronously
	fs.unlink(outputPath, (err) => {
		if (err) {
			console.error(err);
		} else {
			console.log('File is deleted.');
		}
	});

	// Output as JSON and exit. 
	await new Promise((resolve, reject) => {
		outStream.write("[\n");
		for (i = 0; i < urls.length; i++) {
			let l = `\t"${urls[i].loc}"${i == urls.length - 1 ? "" : ","}\n`;
			outStream.write(l);
		};
		outStream.write("]\n");
		outStream.close();
		outStream.on('close', resolve);
		outStream.on('error', reject);
	});
};

module.exports = convertSitemap;
