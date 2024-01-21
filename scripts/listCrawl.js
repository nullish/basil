/**
 * @file listCrawl
 * @desc Crawl a list of items such as a search results or product listing and return list of URLs for use in a subsequent web scrape
 */

const puppeteer = require("puppeteer");
const fs = require('fs');

const basilListCrawl = async (args) => {
  const { startUrl, linkSelector, moreItems } = args.listCrawl; // Params needed for crawling list page(s)
  const outPath = "../input/linkcrawl.csv";

  console.log(
    `Collecting links to parse from: ${startUrl}`
  );

  // Remove existing output file if present
  fs.unlink(outPath, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Existing output deleted.');
    }
  });

  // fs.appendFileSync(outPath, `${headerRow}\n`);
  // Split up the Array of arrPages
  let k = 0;

  k++;
  // Launch and Setup Chromium
  const browser = await puppeteer.launch({ headless: "new" });
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  page.setJavaScriptEnabled(true);


  /** @todo modify to run scrape without using parallel batches */
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

};

module.exports = basilListCrawl;
