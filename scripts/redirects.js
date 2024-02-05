/**
 * @name Redirect checker
 *
 * @desc Returns final destination URL and status code.
 */
const puppeteer = require("puppeteer");
const fs = require("fs");
const csvOneDimArray = require("../csv-onedim-array"); // Loads CSV input and translates to array, element per row
const downloadData = require("../downloadData"); // download from HTTP source
const writeFileAsync = require("../writeFileAsync"); // write file locally
const convertSitemap = require("../convertSitemap"); // Converts XML sitemap for JSON input
const listCrawler = require("./listCrawler"); // Puppeteer script to scrape links from a listing page, to be used as input

const basilRedirects = async (args) => {
  const {parallel, input, urlSitemap, listCrawl, outputPath} = args; // Passed from index.js containing specifics for the scrape
  const filePath = "./input/sitemap.xml"; // Path to store sitemap XML
  const jsonSitemap = "../input/sitemap.json"; // Path to store sitemap coverted to JSON
  const outPath =
    typeof outputPath == "undefined" ? "./output/webscrape.csv" : outputPath;
  const headerRow =
    '"timeStamp","RequestURL","ResponseURL","statusCode","statusText","lastRedirectStatusCode","lastRedirectStatusText","pageTitle","h1","Error"'; // Header row for output

  /* Get input of URLs for both input path, sitemap, and scrape of a listing page, depending on what config specifies.
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
      console.log("File has been written successfully.");
      await convertSitemap();
      console.log("Sitemap converted for input to web scrape.");
      const objSitemap = require(jsonSitemap);
      arrPages.push(...objSitemap);
    } catch (error) {
      console.error("Error:", error.message || error);
    }
  }

  // Get URLs from scraping a list on the target website, such as a product listing.
  if (listCrawl) {
    try {
      const arrListLinks = await listCrawler(listCrawl); // Run the listCrawler module with params passed from config object
      arrPages.push(...arrListLinks);
    } catch (error) {
      console.error("Error:", error.message || error);
    };
  }

  const arrUniquePages = [...new Set(arrPages)]; // Remove duplicate from array of URLs
  const parallelBatches = Math.ceil(arrUniquePages.length / parallel);
  console.log(
    `Scraping ${arrUniquePages.length} pages for redirects, in batches of ${parallel}`
  );

  // Remove existing output file if present
  fs.unlink(outPath, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Existing output deleted.");
    }
  });
  console.log(" This will result in " + parallelBatches + " batches.");
  console.log(headerRow);

  fs.appendFileSync(outPath, `${headerRow}\n`);
  // Split up the Array of arrPages
  let k = 0;
  for (let i = 0; i < arrUniquePages.length; i += parallel) {
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
      if (arrUniquePages[elem] != undefined) {
        // Promise to scrape pages
        // promises push
        promises.push(
          browser.newPage().then(async (page) => {
            try {
              // Set default navigation timeout.
              await page.setDefaultNavigationTimeout(30000);
              // Goto page, wait for timeout as specified in JSON input
              let res = await page.goto(arrUniquePages[elem], {
                waitUntil: "networkidle2",
              });
              let stCode = res.status();
              let stText = res.statusText();
              let resUrl = res.url();
              let elTitle = await page.$x("//title");
              let elHeading = await page.$x("//h1");
              let pageTitle = await page.evaluate(
                (el) => el.innerText,
                elTitle[0]
              );
              let heading = await page.evaluate(
                (el) => el.innerText,
                elHeading[0]
              );
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

module.exports = basilRedirects;
