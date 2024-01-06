/**
 * @name Multi elements
 *
 * @desc Get all instances of a DOM element matched by xpath
 */

const puppeteer = require("puppeteer");

const basilMultiElement = async (args) => {
  const {parallel, input, output, script} = args; // Passed from index.js containing specifics for the scrape
  const inputPath = input.match(/\.\.\//) ? input : '../' + input;
  const arrPages = require(inputPath);
  const parallelBatches = Math.ceil(arrPages.length / parallel);
  const confEl = script.params.find(e => e.key == 'element').value;

  console.log('Scraping ' + arrPages.length + ' pages for shuspace links, in batches of ' + parallel)

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
            await page.goto(arrPages[elem], {
              waitUntil: "networkidle2",
            });
            
            let timeStamp = new Date(Date.now()).toISOString();
            // Evaluate page to get all elements matching CSS selector
            const lnx = await page.$$eval(confEl, as => as.map(a => [a.innerText, a.href]));
            let arrOut = await lnx.map(e => [timeStamp, arrPages[elem], e[0].trim(), e[1]]);
            let strOut = arrOut.map(e => ('"' + e.join('","') + '"'));
            strOut.forEach(e => {
              console.log(e);
            })
            // Log if element not found
            if (strOut.length == 0) {
              console.log(`"${timeStamp}","${arrPages[elem]}","ELEMENT NOT FOUND",""`);
            }
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

module.exports = basilMultiElement;
