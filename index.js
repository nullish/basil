/** @file Index
 * @description Entry point: handles settings from user supplied config file and overrides
 * from commans line to run Puppeteer web scrape scripts.
 */

const yargs = require('yargs');
const fs = require('fs');
const csvOneDimArray = require("./csv-onedim-array"); // Loads CSV input and translates to array, element per row
const downloadData = require("axios-https-snip"); // download from HTTP source
const writeFileAsync = require("./writeFileAsync"); // write file locally
const convertSitemap = require("sitemap-url-array"); // Converts XML sitemap for JSON input
const listCrawler = require("./scripts/listCrawler"); // Puppeteer script to scrape links from a paginated listing page, to be used as input
const scrollCrawler = require("./scripts/scrollCrawler"); // Puppeteer script to scrape links from a lazy loading listing page, to be used as input
const _progress = require('cli-progress'); // Progress bar that will appear in STDOUT when scraper is running

const main = async () => {
// Load config
const paramConfig = process.argv[2];
const configFile = require('./config.json');
let config = configFile.configs.find(e => e.configName == paramConfig);
const basilScript = require(`./scripts/${config.script.name}`);

// Get overrides from command line
const argv = yargs
    .option('parallel', {
        describe: 'Number of parallel instances',
        type: 'number',
    })
    .option('input', {
        describe: 'File path to JSON list of URLs to scrape',
        type: 'string',
    })
    .option('urlSitemap', {
        describe: 'URL of sitemap to use as input ',
        type: 'string',
    })
    .argv;

// Set properties, preferring command line params over config file where supplied.
config.parallel = argv.parallel || config.parallel;
config.input = argv.input || config.input;
config.urlSitemap = argv.urlSitemap || config.urlSitemap;
console.log(config);

/* Set up input source for running scripts. 
Pass an array of URLs to the scrpt module.
*/

const filePath = "./input/sitemap.xml"; // Path to store sitemap XML
const jsonSitemap = "./input/sitemap.json"; // Path to store sitemap coverted to JSON
const outPath = typeof config.outputPath == "undefined" ? "./output/webscrape.csv" : config.outputPath; // Optional output file location
const followRedirect = typeof config.followRedirect == "undefined" ? true : config.followRedirect; // Option to follow redirects when scraping

/* Get input of URLs for both input path, sitemap, and scrape of a listing page, depending on what config specifies.
  Combine them into a single input.
  */
  const arrPages = [];
  const {input, urlSitemap, pageList, scrollList} = config;

  // Get URLs specified by input path
  if (input) {
    arrPages.push(...csvOneDimArray(input));
  }

  // Get URLs specified by sitemap from web
  if (urlSitemap) {
    try {
      // Download data from the HTTP resource
      console.log("Downloading sitemap from web");
      const dataStream = await downloadData(urlSitemap);
      await writeFileAsync(filePath, dataStream);
      console.log("File has been written successfully.");
      await convertSitemap();
      console.log("Sitemap converted for input to web scrape.");
      const objSitemap = require(jsonSitemap);
      arrPages.push(...objSitemap);
    } catch (error) {
      console.error("Error:", error.message || error);
    }
  }

  /* Get URLs from scraping a list on the target website, such as a product listing.
  List type: paginate
  */

  if (pageList) {
    try {
      const arrListLinks = await listCrawler(pageList); // Run the listCrawler module with params passed from config object
      arrPages.push(...arrListLinks);
    } catch (error) {
      console.error("Error:", error.message || error);
    };
  };

   /* Get URLs from scraping a list on the target website, such as a product listing.
  List type: lazy loading scroll
  */

  if (scrollList) {
    try {
      const arrListLinks = await scrollCrawler(scrollList); // Run the listCrawler module with params passed from config object
      arrPages.push(...arrListLinks);
    } catch (error) {
      console.error("Error:", error.message || error);
    };
  };

  const arrUniquePages = [...new Set(arrPages)]; // Remove duplicate from array of URLs
  config.arrUniquePages = arrUniquePages;

  // Remove existing output file if present
  fs.unlink(outPath, (err) => {
    if (err) {
      console.error(err);
    };
  });

  // create a new progress bar to pass to scraper
  config.bar = new _progress.Bar({
    format: 'progress [{bar}] {percentage}% | ETA: {eta_formatted} | Duration: {duration_formatted} | {value}/{total}'
  }, _progress.Presets['shades_classic']);
  
  return basilScript(config);
};

main();
