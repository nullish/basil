/**
 * @name Get element
 * @desc Get specified attribute value of an element
 */

const puppeteer = require("puppeteer");
const fs = require('fs');
const csvOneDimArray = require('../csv-onedim-array'); // Loads CSV input and translates to array, element per row
const downloadData = require('../downloadData'); // download from HTTP source
const writeFileAsync = require('../writeFileAsync'); // write file locallyconst 
const convertSitemap = require('../convertSitemap'); // Converts XML sitemap for JSON input

const basilGetElement = async (args) => {
  const { parallel, input, urlSitemap, outputPath, script } = args; // Passed from index.js containing specifics for the scrape
  const confEl = script.params.find(e => e.key == 'element').value; // Element to search for from config file
  const confAttr = script.params.find(e => e.key == 'attribute').value; // Attribute to search for from config file
  const filePath = "./input/sitemap.xml"; // Path to store sitemap XML
  const jsonSitemap = "../input/sitemap.json"; // Path to store sitemap coverted to JSON
  const outPath = typeof (outputPath) == 'undefined' ? './output/webscrape.csv' : outputPath;
  const headerRow = '"timestamp","batch","index","URL","Value","Error"'; // Header row for output

  /* Get input of URLs for both input path and sitemap URL, depening on what config specifies.
  Combine them into a single input.
  */
  const arrPages = [];
  // Get URLs specified by input path
  if (input) {
    arrPages.push(...csvOneDimArray(input));
  }

  // Get URLs specified by sitemap from web
  if (urlSitemap) {
    try {
      // Download data from the HTTP resource
      console.log("Downloading sitemap from web");
      const dataStream = await downloadData(urlSitemap);
      await writeFileAsync(filePath, dataStream);
      console.log('File has been written successfully.');
      await convertSitemap();
      console.log("Sitemap converted for input to web scrape.")
      const objSitemap = require(jsonSitemap);
      arrPages.push(...objSitemap);
    } catch (error) {
      console.error('Error:', error.message || error);
    };
  };
  const parallelBatches = Math.ceil(arrPages.length / parallel);

  console.log(
    `Scraping ${arrPages.length} pages for titles, in batches of ${parallel}`
  );

  // Remove existing output file if present
  fs.unlink(outPath, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Existing output deleted.');
    }
  });

  console.log(" This will result in " + parallelBatches + " batches.");
  console.log(headerRow);
  fs.appendFileSync(outPath, `${headerRow}\n`);
  // Split up the Array of arrPages
  let k = 0;
  for (let i = 0; i < arrPages.length; i += parallel) {
    k++;
    // Launch and Setup Chromium
    const browser = await puppeteer.launch({ headless: "new" });
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
        promises.push(
          browser.newPage().then(async (page) => {
            try {
              // Set default navigation timeout.
              await page.setDefaultNavigationTimeout(30000);
              // Goto page, wait for timeout as specified in JSON input
              await page.goto(arrPages[elem], {
                waitUntil: "networkidle2",
              });
              // Get element to search for and report about
              let elHandle = await page.$x(
                confEl,
              );
              let timeStamp = new Date(Date.now()).toISOString();
              // Get attribute value to report
              if (elHandle.length > 0) {
                let txtOut;
                switch (confAttr) {
                  case "innerText":
                    txtOut = await page.evaluate((el) => el.innerText, elHandle[0]);
                    txtOut = txtOut.replace(/\n/g, "");
                    console.log(`"${timeStamp}","${k}","${j}","${arrPages[elem]}","${txtOut}",""`);
                    fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrPages[elem]}","${txtOut}",""\n`);
                    break;
                  case "innerHTML":
                    txtOut = await page.evaluate((el) => el.innerHTML, elHandle[0]);
                    txtOut = txtOut.replace(/\n/g, "");
                    console.log(`"${timeStamp}","${k}","${j}","${arrPages[elem]}","${txtOut}",""`);
                    fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrPages[elem]}","${txtOut}",""\n`);
                    break;
                  default:
                    txtOut = await page.evaluate((el, a) => el.getAttribute(a), elHandle[0], confAttr);
                    txtOut = txtOut.replace(/\n/g, "");
                    fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrPages[elem]}","${txtOut}",""\n`);
                    console.log(`"${timeStamp}","${k}","${j}","${arrPages[elem]}","${txtOut}",""`);
                }
              } else {
                console.log(
                  `"${timeStamp}","${k}","${j}","${arrPages[elem]}","","ELEMENT NOT FOUND"`
                );
                fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrPages[elem]}","","ELEMENT NOT FOUND"\n`);
              }
            } catch (err) {
              let timeStamp = new Date(Date.now()).toISOString();
              console.log(`"${timeStamp}","${k}","${j}","${arrPages[elem]}","","${err}"`);
              fs.appendFileSync(outPath, `"${timeStamp}","${k}","${j}","${arrPages[elem]}","","${err}\n"`);
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
