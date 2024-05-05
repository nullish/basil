/**
 * @name Multi elements
 *
 * @desc Get all instances of a DOM element matched by xpath
 */

const puppeteer = require("puppeteer");
const fs = require('fs');

const basilMultiElement = async (args) => {
  const {parallel, outputPath, arrUniquePages, script, followRedirect } = args; // Passed from index.js containing specifics for the scrape
  const confEl = script.params.find(e => e.key == 'element').value;
  const outPath = typeof (outputPath) == 'undefined' ? './output/webscrape.csv' : outputPath;
  const headerRow = '"timestamp","URL","linkText","linkTarget","Error"';
  const parallelBatches = Math.ceil(arrUniquePages.length / parallel);

  console.log('Scraping ' + arrUniquePages.length + ' pages for shuspace links, in batches of ' + parallel)

  console.log(' This will result in ' + parallelBatches + ' batches.')
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
            
            let timeStamp = new Date(Date.now()).toISOString();
            // Evaluate page to get all elements matching CSS selector
            const lnx = await page.$$eval(confEl, as => as.map(a => [(a.innerText).replace(/\n/g, "||"), a.href]));
            let arrOut = await lnx.map(e => [timeStamp, arrUniquePages[elem], e[0].trim(), e[1]]);
            let strOut = arrOut.map(e => ('"' + e.join('","') + '"'));
            strOut.forEach(e => {
              console.log(e);
              fs.appendFileSync(outPath, `${e}\n`);
            })
            // Log if element not found
            if (strOut.length == 0) {
              console.log(`"${timeStamp}","${arrUniquePages[elem]}","ELEMENT NOT FOUND",""`);
              fs.appendFileSync(outPath, `"${timeStamp}","${arrUniquePages[elem]}","ELEMENT NOT FOUND",""\n`);
            }
          } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toISOString();
            console.log(`"${timeStamp}","${arrUniquePages[elem]}","","${err}"`);
            fs.appendFileSync(outPath, `"${timeStamp}","${arrUniquePages[elem]}","","${err}"\n`);
          }
        }))
      }
    }

    // await promise all and close browser
    await Promise.all(promises)
    await browser.close()
  }
}

module.exports = basilMultiElement;
