/**
 * @name Redirect checker
 *
 * @desc Retruns final destination URL and status code.
 */

 const puppeteer = require('puppeteer')
 const parallel = 8;

// Input array of URLs
 const arrPages = require("../../input/404.json")

 const pageScrape = async (arrPages, parallel) => {
  const parallelBatches = Math.ceil(arrPages.length / parallel)

  console.log('Scraping ' + arrPages.length + ' pages, in batches of ' + parallel)

  console.log(' This will result in ' + parallelBatches + ' batches.')
  console.log('"timeStamp","URL","statusCode","statusText","Error"')

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
            let res = await page.goto(arrPages[elem])
            let stCode = res.status();
            let stText = res.statusText();
            // Element to wait for to confirm page load
            await page.waitForXPath("//title");
            let timeStamp = new Date(Date.now()).toUTCString();
            // Evaluate page to get all elements matching CSS selector
            const lnx = await page.$$eval('a', as => as.map(a => [a.innerText, a.href]));
            for (ln of lnx) {
                let arrOut = [timeStamp, arrPages[elem], stCode, stText]
                let strOut = arrOut.join('","')
                console.log(`"${strOut}"`)
            }
          } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toUTCString();
            console.log(`"${timeStamp}","${arrPages[elem]}","","","${err}"`)
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
