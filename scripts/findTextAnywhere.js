/**
 * @name Find Text Anywhere
 *
 * @desc scrapes body of JSON input URLs and reports pages which match a regex pattern.
 */

 const puppeteer = require('puppeteer');
 const fs = require('fs');

 const basilFindTextAnywhere = async (args) => {
  const {parallel, outputPath, arrUniquePages, script, followRedirect, bar } = args; // Passed from index.js containing specifics for the scrape
  const confRegex = script.params.find(e => e.key == 'regexPattern').value;
  const rx = new RegExp(confRegex, 'gmis'); // Create regex patteern for use when matching against page HTML
  const outPath = typeof outputPath == "undefined" ? "./output/webscrape.csv" : outputPath;
  const parallelBatches = Math.ceil(arrUniquePages.length / parallel);

    console.log('Scraping ' + arrUniquePages.length + ' pages for text pattern , in batches of ' + parallel)

    console.log(' This will result in ' + parallelBatches + ' batches.')
    console.log('"timestamp","batch","index","URL","Matches","Error"')
    fs.appendFileSync(outPath, '"timestamp","batch","index","URL","Matches","Error"');

  // Split up the Array of arrUniquePages
  let k = 0
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
            await page.waitForSelector('body');
            let timeStamp = new Date(Date.now()).toISOString();
            let bodyHTML = await page.$eval('body', element => element.innerHTML);
            // c-nav negative match used to avoid nav items.
            console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${bodyHTML.match(rx) === null ? 0 : bodyHTML.match(rx).length}",""`)
            fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${bodyHTML.match(rx) === null ? 0 : bodyHTML.match(rx).length}",""\n`)
          } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toISOString();
            console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","","${err}"`)
            fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","","${err}\n"`)
          }
        }))
      }
    }

    // await promise all and close browser
    await Promise.all(promises)
    await browser.close();
bar.update(i);()
  }
}

module.exports = basilFindTextAnywhere;
