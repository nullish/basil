/**
 * @name Get GTM Data Layer object
 *
 * @desc scrapes body of JSON input URLs and reports GTM data layer values.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const puppeteerDataLayer = require('puppeteer-datalayer');

const basilGTMdataLayer = async (args) => {
    const { parallel, outputPath, arrUniquePages, script, followRedirect } = args; // Passed from index.js containing specifics for the scrape
    const containerID = script.params.find(e => e.key == "containerID").value;
    const gtmAttributeName = script.params.find(e => e.key == "gtmAttributeName").value;
    const outPath = typeof (outputPath) == 'undefined' ? './output/webscrape.csv' : outputPath;
    const headerRow = '"timestamp","batch","index","URL","GTM unique event","Error"';
    const parallelBatches = Math.ceil(arrUniquePages.length / parallel);

    console.log('Scraping ' + arrUniquePages.length + ' pages in batches of ' + parallel)

    console.log(' This will result in ' + parallelBatches + ' batches.')
    console.log(headerRow);
    fs.appendFileSync(outPath, `${headerRow}\n`);

    // Split up the Array of arrUniquePages
    let k = 0;
    for (let i = 0; i < arrUniquePages.length; i += parallel) {
        k++;
        // Launch and Setup Chromium
        const browser = await puppeteer.launch({ headless: "new" });
        const context = await browser.createBrowserContext();
        const page = await context.newPage();
        page.setJavaScriptEnabled(true);

        const promises = [];
        for (let j = 0; j < parallel; j++) {
            let elem = i + j;
            // only proceed if there is an element
            if (arrUniquePages[elem] != undefined) {
                // Promise to scrape pages
                // promises push
                promises.push(browser.newPage().then(async page => {
                    try {
                        // Set default navigation timeout.
                        await page.setDefaultNavigationTimeout(30000);
                        // Goto page, wait for timeout as specified in JSON input
                        await page.goto(arrUniquePages[elem], {
                            waitUntil: "networkidle2",
                        });

                        let timeStamp = new Date(Date.now()).toISOString();
                        const dlGTM = new puppeteerDataLayer(page, containerID);
                        /* Uncomment for testing which variables you want to scrape
                        const dataModel = await dlGTM.getDataModel();
                        console.log(dataModel);
                        */
                        let gtmAttributeValue = await dlGTM.get(gtmAttributeName);
                        arrOut = [timeStamp, arrUniquePages[elem], gtmAttributeValue];
                        let strOut = arrOut.join('","');
                        console.log(`"${strOut}"`);
                        fs.appendFileSync(outPath, `"${strOut}"\n`)
                    } catch (err) {
                        // Report failing element and standard error response
                        let timeStamp = new Date(Date.now()).toISOString();
                        console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","","${err}"`);
                        fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","","${err}\n"`);
                    }
                }))
            }
        }

        // await promise all and close browser
        await Promise.all(promises);
        await browser.close();
    }
}

module.exports = basilGTMdataLayer;
