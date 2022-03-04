/**
 * @name Redirect checker
 *
 * @desc Returns final destination URL and status code.
 */

 const puppeteer = require('puppeteer')
 const parallel = 8;

// Input array of URLs
const arg = process.argv[2]
const inputPath = arg ? "../../" + arg : "/url/list.json";

const arrPages = require(inputPath);

const pageScrape = async (arrPages, parallel) => {
  const parallelBatches = Math.ceil(arrPages.length / parallel)

  console.log('Scraping ' + arrPages.length + ' pages, in batches of ' + parallel)

  console.log(' This will result in ' + parallelBatches + ' batches.')
  console.log('"timeStamp","RequestURL","ResponseURL","statusCode","statusText","lastRedirectStatusCode","lastRedirectStatusText","pageTitle","h1","Error"')

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
            let resUrl = res.url(); 

            // Element to wait for to confirm page load
            await page.waitForXPath("//title");
            let elTitle = await page.$x("//title");
            let elHeading = await page.$x("//h1");
            let pageTitle = await page.evaluate(el => el.innerText, elTitle[0]);
            let heading = await page.evaluate(el => el.innerText, elHeading[0]);
            let timeStamp = new Date(Date.now()).toISOString();
            let arrOut;
            if (res.request().redirectChain().length > 0) {
              let chain = res.request().redirectChain();
              let lastRedirect = chain[chain.length - 1];
              let lastRedirectStatusCode = lastRedirect._response._status;
              let lastRedirectStatusText = lastRedirect._response._statusText;
              arrOut = [timeStamp, arrPages[elem], resUrl, stCode, stText, lastRedirectStatusCode, lastRedirectStatusText, pageTitle, heading];
            } else {
              arrOut = [timeStamp, arrPages[elem], resUrl, stCode, stText, "", "", pageTitle, heading];
            }
            let strOut = arrOut.join('","')
            console.log(`"${strOut}"`)
          } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toISOString();
            console.log(`"${timeStamp}","${arrPages[elem]}","","","","","","","",""${err}"`)
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
