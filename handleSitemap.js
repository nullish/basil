/** @file Handle sitemap
 * @description Downloads a sitemap from web and converts to JSON for use by Basil script
 */

const https = require("https");
const fs = require("fs");
const parser = require("xml2json");
const { updateLocale } = require("yargs");

const handleSitemap = (urlSitemap) => {
  /** @function Convert sitemap
   * @param urlSitemap
   * Downloads a sitemap from web and converts to JSON for use by Basil script
   */
  const convertSitemap = () => {
    /** @function convertSitemap
     * Code to parse XML from tmp and output as
     * JSON for use as input by Basil
     */
    const filePath = "./input/sitemap.json";

    // Check for existing file and remove
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    };

    console.log("Converting sitemap... ");
    try {
      const writer = fs.createWriteStream(
        filePath,
        { flags: "a" } // appends data
      );
      const xmlSiteMap = fs.readFileSync("./tmp/sitemap.xml");
      const jsonSiteMap = parser.toJson(xmlSiteMap);
      const json = JSON.parse(jsonSiteMap);
      const urls = json.urlset.url;
      // Convert a record at a time from each URL element
      writer.write("[\n");
      urls.forEach((e) => {
        writer.write(`\t"${e.loc}"${urls.indexOf(e) == urls.length - 1 ? '' : ','}\n`); // Handle trailing commas for JSON format to omit from final element
      });
      writer.write("]\n");
      writer.end();
      console.log("Sitemap converted");
      const sitemap = require(filePath);
      return true;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  const downloadSitemap = (urlSitemap, callBack) => {
    /** @function downloadSitemap
     * Download sitemap XML from web to local file system
     * @param urlSitemap 
     * @param callBack
     */
    const writer = fs.createWriteStream("./tmp/sitemap.xml");
    console.log("Initiating file stream... ");
    const request = https.get(urlSitemap, function (response) {
      console.log("file downloading ...");
      response.pipe(writer);
      writer.on("finish", function () {
        console.log("file downloaded to ", "./tmp/sitemap.xml");
        writer.end();
        console.log("Stream closed.");
        callBack();
      });
      writer.on("error", function (err) {
        console.log(err);
      });
    });
  };

  downloadSitemap(urlSitemap, convertSitemap);
};

module.exports = handleSitemap;
