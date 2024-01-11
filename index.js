/** @file Index
 * @description Entry point: handles settings from user supplied config file and overrides
 * from commans line to run Puppeteer web scrape scripts.
 */

const yargs = require('yargs');

// Load config file
const paramConfig = process.argv[2];
const strConfig = paramConfig.match(/\.\//) ? paramConfig : './' + paramConfig;
let config = require(strConfig);
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

return basilScript(config);
