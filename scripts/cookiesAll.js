/**
 * @name Cookies All
 *
 * @desc Get details of every cookie on a user provided list of pages.
 */

const puppeteer = require("puppeteer");
const fs = require('fs');

 const basilCookiesAll = async (args) => {
  const {parallel, outputPath, arrUniquePages, script} = args; // Passed from index.js containing specifics for the scrape
  const outPath = typeof (outputPath) == 'undefined' ? './output/webscrape.csv' : outputPath;
  const headerRow = '"timestamp","URL","title","name","value","domain","path","expires","secure","session","sourceScheme","sourcePort","Error"'; // Header row for output

  const parallelBatches = Math.ceil(arrUniquePages.length / parallel);

  console.log('Scraping ' + arrUniquePages.length + ' pages in batches of ' + parallel)

  console.log(' This will result in ' + parallelBatches + ' batches.')
  console.log(headerRow);
  fs.appendFileSync(outPath, `${headerRow}\n`);

  // Split up the Array of arrUniquePages
  let k = 0
  for (let i = 0; i < arrUniquePages.length; i += parallel) {
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
      if (arrUniquePages[elem] != undefined) {
        // Promise to scrape pages
        // promises push
        promises.push(browser.newPage().then(async page => {          
          try {
            // Set default navigation timeout.
            await page.setDefaultNavigationTimeout(30000); 
            await page.goto(arrUniquePages[elem], {
              waitUntil: "networkidle2",
            });
            const pageTitle = await page.title();
            let timeStamp = new Date(Date.now()).toISOString();
            // Get all cookies for page. Uses Chrome Developer Tools (CDP) session to access devtools and retieve 3rd party cookies.
            const client = await page.target().createCDPSession();
            const cookies = (await client.send('Storage.getCookies')).cookies;
            await client.detach();
            /* Use when only 1st party cookies are required
            const cookies = await page.cookies();
            */ 
            let arrOut = await cookies.map(e => [timeStamp, arrUniquePages[elem], pageTitle, e.name, e.value, e.domain, e.path, new Date(Date(e.expires)).toISOString(), e.secure, e.session, e.sourceScheme, e.sourcePort]);
            // remove double quotes and commas from all elements to prevent delimiter problems in CSV.
            let arrClean = arrOut.map(subArray => [...subArray].map(e => typeof(e) == "string" ? e.replace(/"|,/g, "") : e));
            let strOut = arrClean.map(e => ('"' + e.join('","') + '",""'));
            strOut.forEach(e => {
              console.log(e);
              fs.appendFileSync(outPath, `${e}\n`);
            })
          } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toISOString();
            console.log(`"${timeStamp}","${arrUniquePages[elem]}","","","","","","","","","","","${err}"`);
            fs.appendFileSync(outPath, `"${timeStamp}","${arrUniquePages[elem]}","","","","","","","","","","","${err}"`);
          }
        }))
      }
    }

    // await promise all and close browser
    await Promise.all(promises)
    await browser.close()
  }
}

module.exports = basilCookiesAll;
