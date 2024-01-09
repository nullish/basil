/**
 * @name Check for element
 *
 * @desc Tests for presence of a DOM element and returns true / false if it's there.
 */

const puppeteer = require('puppeteer');
const handleSitemap = require('../handleSitemap'); // processes sitemaap from web into JSON input

const basilCheckForElement = async (args) => {
  const {parallel, input, urlSitemap, script} = args; // Passed from index.js containing specifics for the scrape
  let inputPath;
  if (typeof(input) !== 'undefined') { inputPath = input.match(/\.\.\//) ? input : '../' + input };
  const confEl = script.params.find(e => e.key == 'element').value;

  // Get input of URLs from input path or sitemap URL. Input path takes precedence.
  let arrPages;
  if (inputPath) {
    arrPages = require(inputPath);
  } else {
    console.log(handleSitemap(urlSitemap));
    arrPages = require('../input/sitemap.json');
  };
  const parallelBatches = Math.ceil(arrPages.length / parallel);

  console.log('Scraping ' + arrPages.length + ' pages in batches of ' + parallel)

  console.log(' This will result in ' + parallelBatches + ' batches.')
  console.log('"timestamp","batch","index","URL","Present","Error"')

  // Split up the Array of arrPages
  let k = 0
  for (let i = 0; i < arrPages.length; i += parallel) {
    k++
    // Launch and Setup Chromium
    const browser = await puppeteer.launch();
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    page.setJavaScriptEnabled(true)

    const promises = []
    for (let j = 0; j < parallel; j++) {
      let elem = i + j
      // only proceed if there is an element 
      if (arrPages[elem] != undefined) {
        // Promise to scrape pages
        // promises push
        promises.push(browser.newPage().then(async page => {
          try {
            // Set default navigation timeout.
            await page.setDefaultNavigationTimeout(30000);
            // Goto page, wait for timeout as specified in JSON input
            await page.goto(arrPages[elem], {
              waitUntil: "networkidle2",
            });

            // Get element to search for and report about
            let elHandle = await page.$x(confEl);
            let timeStamp = new Date(Date.now()).toISOString();
            // Get attribute value to report
            if (elHandle.length > 0) {
              console.log(`"${timeStamp}","${k}","${j}","${arrPages[elem]}","true",""`)
            } else {
              console.log(`"${timeStamp}","${k}","${j}","${arrPages[elem]}","false",""`)
            }
          } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toISOString();
            console.log(`"${timeStamp}","${k}","${j}","${arrPages[elem]}","","${err}"`)
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
