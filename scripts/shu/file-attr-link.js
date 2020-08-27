/**
 * @name File attribute links
 *
 * @desc Get link text for all links with file attributes in description
 */

 const puppeteer = require('puppeteer')
 const parallel = 8;

 const arrPages = require("../../input/all-shu.json")

 const pageScrape = async (arrPages, parallel) => {
  const parallelBatches = Math.ceil(arrPages.length / parallel)

  console.log('Scraping ' + arrPages.length + ' pages for titles, in batches of ' + parallel)

  console.log(' This will result in ' + parallelBatches + ' batches.')
  console.log('"timestamp","URL","linkText","linkTarget","Error"')

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
            await page.goto(arrPages[elem])
            // Element to wait for to confirm page load
            await page.waitForXPath("//title");
            // Get element to search for and report about
            let timeStamp = new Date(Date.now()).toUTCString();
            // Get attribute value to report
            const lnx = await page.$$eval('a', as => as.map(a => [a.innerText, a.href]));
            for (ln of lnx) {
              if (ln[0].match(/.+\([a-zA-Z]{3,},?(\s[0-9]{1,}\s?(K|M)B)?\)/g)) {
                let arrOut = [timeStamp, arrPages[elem], ln[0].trim(), ln[1]]
                let strOut = arrOut.join('","')
                console.log(`"${strOut}"`)
              } 
            }
          } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toUTCString();
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
