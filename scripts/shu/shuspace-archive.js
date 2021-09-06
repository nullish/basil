/**
 * @name SHUspace archived pages
 *
 * @desc Gets 1st <p> tag to report pages weith verbal redirects or access denied.
 */

const puppeteer = require('puppeteer')
const parallel = 8;

const arrPages = require("../../input/shuspace-archive.json")

const pageScrape = async(arrPages, parallel) => {
    const parallelBatches = Math.ceil(arrPages.length / parallel)

    console.log('Scraping ' + arrPages.length + ' pages for titles, in batches of ' + parallel)

    console.log(' This will result in ' + parallelBatches + ' batches.')
    console.log('"timestamp","batch","index","URL","Title","Error"')

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
                        let elHead = await page.$x("(//h1)[2]")
                        let elHandle = await page.$x("(//p)[1]");
                        let pageType = "Content";
                        let txtHead = await page.evaluate(el => el.innerText, elHead[0]);
                        let txtHandle = await page.evaluate(el => el.innerText, elHandle[0]);
                        if (txtHead == 'Access denied') {
                            pageType = 'Access denied';
                        };
                        if (txtHandle == 'Thank you for looking for this information.') {
                            pageType = 'Verbal redirect';
                        };
                        let timeStamp = new Date(Date.now()).toISOString();
                        // Get attribute value to report
                        console.log(`"${timeStamp}","${k}","${j}","${arrPages[elem]}","${pageType}",""`)
                    } catch (err) {
                        // Report failing element and standard error response
                        let timeStamp = new Date(Date.now()).toISOString();
                        console.log(`"${timeStamp}","${k}","${j}","${arrPages[elem]}","","${err}"`)
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