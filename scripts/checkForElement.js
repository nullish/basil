/**
 * @name Check for element
 *
 * @desc Tests for presence of a DOM element and returns true / false if it's there.
 */

const puppeteer = require('puppeteer');
const fs = require("fs");
const _progress = require('cli-progress');
const _colors = require('ansi-colors');


const basilCheckForElement = async (args) => {
  const {parallel, outputPath, arrUniquePages, script, followRedirect } = args; // Passed from index.js containing specifics for the scrape
  const confEl = script.params.find(e => e.key == 'element').value;
  const parallelBatches = Math.ceil(arrUniquePages.length / parallel);
  const outPath = typeof outputPath == "undefined" ? "./output/webscrape.csv" : outputPath;
  console.log('Scraping ' + arrUniquePages.length + ' pages in batches of ' + parallel)

  console.log(' This will result in ' + parallelBatches + ' batches.')
  const headerRow = '"timestamp","batch","index","URL","Present","Error"';

  fs.appendFileSync(outPath, `${headerRow}\n`);
  // Split up the Array of arrUniquePages
  let k = 0;
  // create a new progress bar with preset
  const bar = new _progress.Bar({}, _progress.Presets['shades_classic']);
  bar.start(arrUniquePages.length, 0);
  for (let i = 0; i < arrUniquePages.length; i += parallel) {
    k++
    // Launch and Setup Chromium
    const browser = await puppeteer.launch({headless: "new"});
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.setJavaScriptEnabled(true)

    const promises = []
    for (let j = 0; j < parallel; j++) {
      let elem = i + j
      // only proceed if there is an element 
      if (arrUniquePages[elem] != undefined) {
        // Promise to scrape pages
        // promises push
        promises.push(browser.newPage().then(async page => {
   // If config value is false, abort on encountering redirect
            if (!followRedirect) {
              await page.setRequestInterception(true); 
              page.on('request', (request) => {
                if (request.isNavigationRequest() && request.redirectChain().length) {
                  request.abort();
                } else {
                  request.continue();
                };
            });
          };
          try {
            // Set default navigation timeout.
            await page.setDefaultNavigationTimeout(30000);
            // Goto page, wait for timeout as specified in JSON input
            await page.goto(arrUniquePages[elem], {
              waitUntil: "networkidle2",
            });

            // Get element to search for and report about
            let boolHandle = await page.waitForSelector(confEl) ? true : false;
            let timeStamp = new Date(Date.now()).toISOString();
            // Get attribute value to report
            //console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${boolHandle}",""`)
            fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${boolHandle}",""\n`);
          } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toISOString();
            //console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","","${err}"`)
            fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","","${err}"\n`)
          }
        }))
      }
    }

    // await promise all and close browser
    await Promise.all(promises)
    await browser.close()
    bar.update(i);
  }
  bar.stop();
};

module.exports = basilCheckForElement;
