/** @file Index
 * @description Entry point: handles settings from user supplied config file and overrides
 * from commans line to run Puppeteer web scrape scripts.
 */

const yargs = require('yargs');

// Load config file
const paramConfig = process.argv[2];
const strConfig  = paramConfig.match(/\.\//) ? paramConfig : './' + paramConfig;
const config = require(strConfig);

console.log(config);