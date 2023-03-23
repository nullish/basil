/**
 * @name Get GTM Data Layer object
 *
 * @desc scrapes body of JSON input URLs and reports GTM data layer values.
 */

const puppeteer = require('puppeteer');
const puppeteerDataLayer = require('puppeteer-datalayer');
const containerID = "GTM-MKVMPL"; // Google Tag Manager container ID

const parallel = 8;

// Input array of URLs
const arg = process.argv[2]
const inputPath = arg ? "../../" + arg : "/url/list.json";

const arrPages = require(inputPath);

const pageScrape = async (arrPages, parallel) => {
    const parallelBatches = Math.ceil(arrPages.length / parallel);

    console.log('Scraping ' + arrPages.length + ' pages for titles, in batches of ' + parallel);

    console.log(' This will result in ' + parallelBatches + ' batches.');
    console.log('"timestamp","batch","index","URL","GTM unique event","Error"');

    // Split up the Array of arrPages
    let k = 0;
    for (let i = 0; i < arrPages.length; i += parallel) {
        k++;
        // Launch and Setup Chromium
        const browser = await puppeteer.launch();
        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();
        page.setJavaScriptEnabled(true);

        const promises = [];
        for (let j = 0; j < parallel; j++) {
            let elem = i + j;
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
                        // Element to wait for to confirm page load
                        await page.waitForXPath("//title");
                        let timeStamp = new Date(Date.now()).toISOString();
                        const dlGTM = new puppeteerDataLayer(page, containerID);
                        /* Uncomment for testing which variables you want to scrape
                        const dataModel = await dlGTM.getDataModel();
                        console.log(dataModel);
                        */
                        let gtmUniqueEventID = await dlGTM.get('gtm.uniqueEventId');
                        arrOut = [timeStamp, arrPages[elem], gtmUniqueEventID];
                        let strOut = arrOut.join('","')
                        console.log(`"${strOut}"`)
                    } catch (err) {
                        // Report failing element and standard error response
                        let timeStamp = new Date(Date.now()).toISOString();
                        console.log(`"${timeStamp}","${k}","${j}","${arrPages[elem]}","","${err}"`);
                    }
                }))
            }
        }

        // await promise all and close browser
        await Promise.all(promises);
        await browser.close();
    }
}

pageScrape(arrPages, parallel);
