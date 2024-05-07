/**
 * @name Get element
 * @desc Get specified attribute value of an element
 */

const puppeteer = require("puppeteer");
const fs = require('fs');
const { Console } = require("console");

const basilGetElement = async (args) => {
  const { parallel, outputPath, arrUniquePages, script, followRedirect, bar } = args; // Passed from index.js containing specifics for the scrape
  const confEl = script.params.find(e => e.key == 'element').value; // Element to search for from config file
  const confAttr = script.params.find(e => e.key == 'attribute').value; // Attribute to search for from config file
  const outPath = typeof (outputPath) == 'undefined' ? './output/webscrape.csv' : outputPath;
  const headerRow = '"timestamp","batch","index","URL","Value","Error"'; // Header row for output

  const parallelBatches = Math.ceil(arrUniquePages.length / parallel);

  console.log(
    `Scraping ${arrUniquePages.length} pages for titles, in batches of ${parallel}`
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
              // Get element to search for and report about
              let elHandle = await page.waitForSelector(
                confEl,
              );
              let timeStamp = new Date(Date.now()).toISOString();
              // Get attribute value to report
              let txtOut;
              switch (confAttr) {
                case "innerHTML":
                  txtOut = await page.$eval(confEl, element => element.innerHTML);
                  txtOut = txtOut.replace(/\n/g, "");
                  console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${txtOut}",""`);
                  fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${txtOut}",""\n`);
                  break;
                case "innerText":
                  txtOut = await page.$eval(confEl, element => element.innerText);
                  txtOut = txtOut.replace(/\n/g, "");
                  console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${txtOut}",""`);
                  fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${txtOut}",""\n`);
                  break;
                default:
                  txtOut = await page.$eval(
                    confEl,
                    (element, a) => element.getAttribute(a),
                    confAttr
                  );
                  txtOut = txtOut.replace(/\n/g, "");
                  console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${txtOut}",""`);
                  fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${txtOut}",""\n`);
              }
            } catch (err) {
              let timeStamp = new Date(Date.now()).toISOString();
              console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","","${err}"`);
              fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","","${err}\n"`);
            }
          }),
        );
      }
    }

    // await promise all and close browser
    await Promise.all(promises);
    await browser.close();
bar.update(i);();
  }
};

module.exports = basilGetElement;
