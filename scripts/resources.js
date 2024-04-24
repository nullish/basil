/**
 * @name Resources
 *
 * @desc Get details of all HTTP requested resources from a user provided list of pages.
 */

const puppeteer = require("puppeteer");
const fs = require('fs');

 const basilResources = async (args) => {
  const {parallel, outputPath, arrUniquePages} = args; // Passed from index.js containing specifics for the scrape
  const outPath = typeof (outputPath) == 'undefined' ? './output/webscrape.csv' : outputPath;
  const headerRow = '"timestamp","URL","resourceURI","Error"'; // Header row for output

  const parallelBatches = Math.ceil(arrUniquePages.length / parallel);

  console.log('Scraping ' + arrUniquePages.length + ' pages in batches of ' + parallel);

  console.log(' This will result in ' + parallelBatches + ' batches.');
  console.log(headerRow);
  fs.appendFileSync(outPath, `${headerRow}\n`);

  // Split up the Array of arrUniquePages
  let k = 0
  for (let i = 0; i < arrUniquePages.length; i += parallel) {
    k++;
    // Launch and Setup Chromium
    const browser = await puppeteer.launch({headless: "new"});
    const context = await browser.createIncognitoBrowserContext();
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
            // Build array of all resources downloaded in request for output
            let ress = [];
            page.on('requestfinished', (request) => {
              ress.push(request.url());
          });
            await page.goto(arrUniquePages[elem], {
              waitUntil: "networkidle2",
            });
            let timeStamp = new Date(Date.now()).toISOString(); 
            let arrOut = await ress.map(e => [timeStamp, arrUniquePages[elem], e]);
            let strOut = arrOut.map(e => ('"' + e.join('","') + '",""'));
            strOut.forEach(e => {
              console.log(e);
              fs.appendFileSync(outPath, `${e}\n`);
            });
          } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toISOString();
            console.log(`"${timeStamp}","${arrUniquePages[elem]}","","${err}"`);
            fs.appendFileSync(outPath, `"${timeStamp}","${arrUniquePages[elem]}","","${err}"`);
          }
        }));
      }
    }

    // await promise all and close browser
    await Promise.all(promises);
    await browser.close();
  }
};

module.exports = basilResources;
