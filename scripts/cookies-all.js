/**
 * @name Cookies All
 *
 * @desc Get details of every cookie on a user provided list of pages.
 */

 const puppeteer = require('puppeteer')
 const parallel = 8;

// Input array of URLs
const arg = process.argv[2]
const inputPath = arg ? "../../" + arg : "/url/list.json";

const arrPages = require(inputPath);

 const pageScrape = async (arrPages, parallel) => {
  const parallelBatches = Math.ceil(arrPages.length / parallel)

  console.log('Scraping ' + arrPages.length + ' pages in batches of ' + parallel)

  console.log(' This will result in ' + parallelBatches + ' batches.')
  console.log('"timestamp","URL","title","name","value","domain","path","expires","secure","session","sourceScheme","sourcePort","Error"')

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
            await page.goto(arrPages[elem], {
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
            let arrOut = await cookies.map(e => [timeStamp, arrPages[elem], pageTitle, e.name, e.value, e.domain, e.path, new Date(Date(e.expires)).toISOString(), e.secure, e.session, e.sourceScheme, e.sourcePort]);
            // remove double quotes and commas from all elements to prevent delimiter problems in CSV.
            let arrClean = arrOut.map(subArray => [...subArray].map(e => typeof(e) == "string" ? e.replace(/"|,/g, "") : e));
            let strOut = arrClean.map(e => ('"' + e.join('","') + '",""'));
            //console.log(...strOut);
            strOut.forEach(e => {
              console.log(e);
            })
          } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toISOString();
            console.log(`"${timeStamp}","${arrPages[elem]}","","","","","","","","","","","${err}"`)
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