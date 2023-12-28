/** @file Index
 * @description Entry point: handles settings from user supplied config file and overrides
 * from commans line to run Puppeteer web scrape scripts.
 */

const yargs = require('yargs');

// Load config file
const paramConfig = process.argv[2];
const strConfig = paramConfig.match(/\.\//) ? paramConfig : './' + paramConfig;
const config = require(strConfig);

console.log(config);

// Get overrides from command line
const argv = yargs
    .option('instances', {
        describe: 'Number of parallel instances',
        type: 'number'
    })
    .option('input', {
        describe: 'File path to JSON list of URLs to scrape',
        type: 'string'
    })
    .option('output', {
        describe: 'File path to CSV of output from script',
        type: 'string'
    })
    .option('sitemap', {
        describe: 'URL of sitemap to use as input ',
        type: 'string'
    })
    .argv;

// Set properties, preferring command line params over config file where supplied.
const instances = argv.instances || config.instances;
const input = argv.input || config.input;
const output = argv.output || config.output;
const sitemap = argv.sitemap || config.sitemap;

// Load script specifc variables
const scriptParams = config.scipt.params;

console.log(instances, input, output, sitemap);
