/**
 * @name Check for element
 *
 * @desc Tests for presence of a DOM element and returns true / false if it's there.
 */

const puppeteer = require('puppeteer');
const fs = require("fs");

const basilCheckForElement = async (args) => {
  const {parallel, outputPath, arrUniquePages, script} = args; // Passed from index.js containing specifics for the scrape
  const confEl = script.params.find(e => e.key == 'element').value;
  const parallelBatches = Math.ceil(arrUniquePages.length / parallel);
  const outPath = typeof outputPath == "undefined" ? "./output/webscrape.csv" : outputPath;
  console.log('Scraping ' + arrUniquePages.length + ' pages in batches of ' + parallel)

  console.log(' This will result in ' + parallelBatches + ' batches.')
  const headerRow = '"timestamp","batch","index","URL","Present","Error"';
  console.log(headerRow);

  fs.appendFileSync(outPath, `${headerRow}\n`);
  // Split up the Array of arrUniquePages
  let k = 0
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
            console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${boolHandle}",""`)
            fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${boolHandle}",""\n`);
          } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toISOString();
            console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","","${err}"`)
            fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","","${err}"\n`)
          }
        }))
      }
    }

    // await promise all and close browser
    await Promise.all(promises)
    await browser.close()
  }
};

module.exports = basilCheckForElement;
