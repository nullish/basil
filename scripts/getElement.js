/**
 * @name Get element
 * @desc Get specified attribute value of an element
 */

const puppeteer = require("puppeteer");
const fs = require('fs');
const { Console } = require("console");

const basilGetElement = async (args) => {
  const {parallel, outputPath, arrUniquePages, script} = args; // Passed from index.js containing specifics for the scrape
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
              /** @todo continue to refactor according to testEl val below */
              const testEl = await page.$eval(confEl, element => element.innerText);
              let timeStamp = new Date(Date.now()).toISOString();
              // Get attribute value to report
              if (elHandle.length > 0) {
                let txtOut;
                switch (confAttr) {
                  case "innerText":
                    txtOut = await page.evaluate((el) => el.innerText, elHandle[0]);
                    txtOut = txtOut.replace(/\n/g, "");
                    console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${txtOut}",""`);
                    fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${txtOut}",""\n`);
                    break;
                  case "innerHTML":
                    txtOut = await page.evaluate((el) => el.innerHTML, elHandle[0]);
                    txtOut = txtOut.replace(/\n/g, "");
                    console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${txtOut}",""`);
                    fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${txtOut}",""\n`);
                    break;
                  default:
                    txtOut = await page.evaluate((el, a) => el.getAttribute(a), elHandle[0], confAttr);
                    txtOut = txtOut.replace(/\n/g, "");
                    fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${txtOut}",""\n`);
                    console.log(`"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","${txtOut}",""`);
                }
              } else {
                console.log(
                  `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","","ELEMENT NOT FOUND"`
                );
                fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrUniquePages[elem]}","","ELEMENT NOT FOUND"\n`);
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
  }
};

module.exports = basilGetElement;
