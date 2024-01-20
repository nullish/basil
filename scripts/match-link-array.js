/**
 * @name Match link array
 *
 * @desc Reports all matching instances from an array of links by crawling a supplied list of URLs.
 */


 const puppeteer = require('puppeteer')
 const parallel = 8;

 // Input array of URLs
const arg = process.argv[2]
const inputPath = arg ? "../../" + arg : "/url/list.json";

const arrayLocate = (arrX, arrY, matchState = true) => {
  /* returns elements in array X which  appear in array Y
  If matchState is set to false then elements which do not match are found.
  */
  const arrLocate  = matchState ? 
   arrX.filter(elX => arrY.includes(elX)) :
   arrX.filter(elX => !arrY.includes(elX));
  return arrLocate;
};

const arrayAppendSlash = (arrIn) => {
  // For each elenent in an array, if it does not end with a /, append one
  const arrOut = arrIn.map(e => { return e.replace(/([a-zA-Z0-9-_])$/, "$1/")});
  return arrOut;
};

// Input array of links
const jsonInputLinks = process.argv[3];
if (!jsonInputLinks) {
  throw new Error("You must supply a JSON file comprising an array of URLs to look for");
};
const arrInputLinks = require("../../" + jsonInputLinks);

// Ensure all input URLs have matching format by conditionally appending a forward slash
const arrCleanInputLinks = arrayAppendSlash(arrInputLinks);

const arrPages = require(inputPath);

  const pageScrape = async (arrPages, parallel) => {
    const parallelBatches = Math.ceil(arrPages.length / parallel)

    console.log('Scraping ' + arrPages.length + ' pages for titles, in batches of ' + parallel)

    console.log(' This will result in ' + parallelBatches + ' batches.')
    console.log('"timestamp","URL","Link URL","Error"')

  // Split up the Array of arrPages
  let k = 0
  for (let i = 0; i < arrPages.length; i += parallel) {
    k++
    // Launch and Setup Chromium
    const browser = await puppeteer.launch({headless: "new"})({ headless: "new" });
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
            
            // Get URLs for all links on page
            const lnx = await page.$$eval('a', as => as.map(a => a.href));
            let timeStamp = new Date(Date.now()).toISOString();
            // Format all links for consistent use of trailing slash
            let cleanLnx = await arrayAppendSlash(lnx);
            let matchedLnx = await arrayLocate(arrCleanInputLinks, cleanLnx);
            let arrOut = await matchedLnx.map(e => [timeStamp, arrPages[elem], e]);
            let strOut = arrOut.length > 0 ?
             arrOut.map(e => ('"' + e.join('","') + '"')) :
             [`"${timeStamp}","${arrPages[elem]}","","NOTHING FOUND"`];
            // console.log(...strOut);
            strOut.forEach(e => {
              console.log(e);
            })
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
