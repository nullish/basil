/**
 * @name Count elements
 *
 * @desc Counts instances of a particular DOM element
 */

 const puppeteer = require('puppeteer')
 const parallel = 8;

// Input array of URLs
const arg = process.argv[2]
const inputPath = arg ? "../../" + arg : "/url/list.json";

const arrPages = require(inputPath);

 const pageScrape = async (arrPages, parallel) => {
  const parallelBatches = Math.ceil(arrPages.length / parallel)

  console.log('Scraping ' + arrPages.length + ' pages for shuspace links, in batches of ' + parallel)

  console.log(' This will result in ' + parallelBatches + ' batches.')
  console.log('"timestamp","URL","Count","Error"')

  // Split up the Array of arrPages
  let k = 0
  for (let i = 0; i < arrPages.length; i += parallel) {
    k++
    // Launch and Setup Chromium
    const browser = await puppeteer.launch({headless: "new"});
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
            
            let timeStamp = new Date(Date.now()).toISOString();
            // Evaluate page to get all elements matching CSS selector
            const lnx = await page.$$eval('div.fluidvids', as => as.map(a => [a.innerHTML]));
            let arrOut = await lnx.map(e => [timeStamp, arrPages[elem], e[0].trim(), e[1]]);
            // Output meta data with input URL and count of DOM elements found
            let strOut = `"${timeStamp}","${arrPages[elem]}","${lnx.length}",""`
            console.log(strOut);
          } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toISOString();
            console.log(`"${timeStamp}","${arrPages[elem]}","","${err}"`)
          }
        }))
      }
    }

    // await promise all and close browser
    await Promise.all(promises)
    await browser.close()
  }
}

pageScrape(arrPages, parallel)
