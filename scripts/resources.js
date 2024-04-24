/**
 * @name Resources
 *
 * @desc Returns resources downloaded by page
 */
const puppeteer = require("puppeteer");
const fs = require("fs");

const basilResources = async (args) => {
  const {parallel, outputPath, arrUniquePages} = args; // Passed from index.js containing specifics for the scrape
  const outPath =
    typeof outputPath == "undefined" ? "./output/webscrape.csv" : outputPath;
  const headerRow =
    '"timeStamp","RequestURL","resourceDomain","Error"'; // Header row for output

  const parallelBatches = Math.ceil(arrUniquePages.length / parallel);
  console.log(
    `Scraping ${arrUniquePages.length} pages for resource domains, in batches of ${parallel}`
  );

  console.log(" This will result in " + parallelBatches + " batches.");
  console.log(headerRow);

  fs.appendFileSync(outPath, `${headerRow}\n`);
  // Split up the Array of arrPages
  let k = 0;
  for (let i = 0; i < arrUniquePages.length; i += parallel) {
    k++;
    // Launch and Setup Chromium
    const browser = await puppeteer.launch({headless: "new"});
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    page.setJavaScriptEnabled(true);

    const promises = [];
    for (let j = 0; j < parallel; j++) {
      let elem = i + j;
      // only proceed if there is an element
      if (arrUniquePages[elem] != undefined) {
        // Promise to scrape pages
        // promises push
        promises.push(
          browser.newPage().then(async (page) => {
            try {
              // Set default navigation timeout.
              await page.setDefaultNavigationTimeout(30000);
              let ress = [];
              // Goto page, wait for timeout as specified in JSON input
              page.on('requestfinished', (request) => {
                ress.push(request.url());
            });
              let res = await page.goto(arrUniquePages[elem], {
                waitUntil: "networkidle2",
              });
              let timeStamp = new Date(Date.now()).toISOString();
              let arrOut;
              if (res.request().redirectChain().length > 0) {
                let chain = res.request().redirectChain();
                let lastRedirect = chain[chain.length - 1];
                let lastRedirectStatusCode = lastRedirect._response._status;
                let lastRedirectStatusText = lastRedirect._response._statusText;
                arrOut = [
                  timeStamp,
                  arrUniquePages[elem],
                  resUrl,
                  stCode,
                  stText,
                  lastRedirectStatusCode,
                  lastRedirectStatusText,
                  pageTitle,
                  heading,
                ];
              } else {
                arrOut = [
                  timeStamp,
                  arrUniquePages[elem],
                  resUrl,
                  stCode,
                  stText,
                  "",
                  "",
                  pageTitle,
                  heading,
                ];
              }
              let strOut = arrOut.join('","');
              fs.appendFileSync(outPath, `"${strOut}"\n`);
              console.log(`"${strOut}"`);
            } catch (err) {
              // Report failing element and standard error response
              let timeStamp = new Date(Date.now()).toISOString();
              fs.appendFileSync(outPath, `"${timeStamp}","${arrUniquePages[elem]}","","","","","","","",""${err}\n"`);
              console.log(
                `"${timeStamp}","${arrUniquePages[elem]}","","","","","","","",""${err}"`
              );
            }
          })
        );
      }
    }

    // await promise all and close browser
    await Promise.all(promises);
    await browser.close();
  }
};

module.exports = basilResources;
