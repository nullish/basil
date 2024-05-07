/**
 * @name Match link array
 *
 * @desc Reports all matching instances from an array of links by crawling a supplied list of URLs.
 */

const puppeteer = require("puppeteer");
const fs = require("fs");

const arrayLocate = (arrX, arrY, matchState = true) => {
  /* returns elements in array X which  appear in array Y
  If matchState is set to false then elements which do not match are found.
  */
  const arrLocate = matchState
    ? arrX.filter((elX) => arrY.includes(elX))
    : arrX.filter((elX) => !arrY.includes(elX));
  return arrLocate;
};

const arrayAppendSlash = (arrIn) => {
  // For each elenent in an array, if it does not end with a /, append one
  const arrOut = arrIn.map((e) => {
    return e.replace(/([a-zA-Z0-9-_])$/, "$1/");
  });
  return arrOut;
};

const basilMatchLinkArray = async (args) => {
  const { parallel, outputPath, arrUniquePages, script, followRedirect, bar } = args; // Passed from index.js containing specifics for the scrape
  const arrInputLinks = script.params.find((e) => e.key == "links").value; // List of links to locate
  const outPath =
    typeof outputPath == "undefined" ? "./output/webscrape.csv" : outputPath;
  const headerRow = '"timestamp","URL","Link URL","Error"'; // Header row for output
  // Ensure all input URLs have matching format by conditionally appending a forward slash
  const arrCleanInputLinks = arrayAppendSlash(arrInputLinks);

  const parallelBatches = Math.ceil(arrUniquePages.length / parallel);

  console.log(
    `Scraping ${arrUniquePages.length} pages for links in array, in batches of ${parallel}`
  );
  console.log(" This will result in " + parallelBatches + " batches.");
  console.log(headerRow);
  fs.appendFileSync(outPath, `${headerRow}\n`);

  // Split up the Array of arrUniquePages
  let k = 0;
  bar.start(arrUniquePages.length, 0);
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
        promises.push(
          browser.newPage().then(async (page) => {
   // If config value is false, abort on encountering redirect
            if (!followRedirect) {
              await page.setRequestInterception(true); 
              page.on('request', (request) => {
                if (request.isNavigationRequest() && request.redirectChain().length) {
                  request.abort();
                } else {
                  request.continue();
                };
            });
          };
            try {
              // Set default navigation timeout.
              await page.setDefaultNavigationTimeout(30000);
              // Goto page, wait for timeout as specified in JSON input
              await page.goto(arrUniquePages[elem], {
                waitUntil: "networkidle2",
              });

              // Get URLs for all links on page
              const lnx = await page.$$eval("a", (as) => as.map((a) => a.href));
              let timeStamp = new Date(Date.now()).toISOString();
              // Format all links for consistent use of trailing slash
              let cleanLnx = await arrayAppendSlash(lnx);
              let matchedLnx = await arrayLocate(arrCleanInputLinks, cleanLnx);
              let arrOut = await matchedLnx.map((e) => [
                timeStamp,
                arrUniquePages[elem].trim(),
                e,
              ]);
              let strOut =
                arrOut.length > 0
                  ? arrOut.map((e) => '"' + e.join('","') + '"')
                  : [`"${timeStamp}","${arrUniquePages[elem]}","","NOTHING FOUND"`];
              strOut.forEach((e) => {
                console.log(e);
                fs.appendFileSync(outPath, `${e}\n`);
              });
            } catch (err) {
              // Report failing element and standard error response
              let timeStamp = new Date(Date.now()).toISOString();
              console.log(`"${timeStamp}","${arrUniquePages[elem]}","","${err}"`);
              fs.appendFileSync(outPath, `"${timeStamp}","${arrUniquePages[elem]}","","${err}"\n`);
            }
          })
        );
      };
    }

    // await promise all and close browser
    await Promise.all(promises);
    await browser.close();
bar.update(i);
  }
 bar.stop();
};

module.exports = basilMatchLinkArray;

