/**
 * @name Find Text Anywhere
 *
 * @desc scrapes body of JSON input URLs and reports pages which match a regex pattern.
 */

 const puppeteer = require('puppeteer')
 const parallel = 8;

 const arrPages = require("../../input/degree-apprenticeships.json");
 const textForURL = 'degree apprenticeship';
 const uriForURL = encodeURIComponent(textForURL);

  const pageScrape = async (arrPages, parallel) => {
    const parallelBatches = Math.ceil(arrPages.length / parallel)

    console.log('Scraping ' + arrPages.length + ' pages for titles, in batches of ' + parallel)

    console.log(' This will result in ' + parallelBatches + ' batches.')
    console.log('"timestamp","batch","index","URL","Page location","Error"')

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
            let elHandle = await page.$x("//body");
            let timeStamp = new Date(Date.now()).toISOString();
            let bodyHTML = await page.evaluate(el => el.innerHTML, elHandle[0]);
            // c-nav negative match used to avoid nav items.
            if (bodyHTML.match(/(?<!higher )degree apprenticeship(?!.*?(c-nav|"Url"))/gmis)) {
              let locationURL = `${arrPages[elem]}#:~:text=${uriForURL}`
              console.log(`"${timeStamp}","${k}","${j}","${arrPages[elem]}","${locationURL}",""`)
            }
          } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toISOString();
            console.log(`"${timeStamp}","${k}","${j}","${arrPages[elem]}","${err}"`)
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
