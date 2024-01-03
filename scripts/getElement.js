/**
 * @name Get element
 *
 * @desc Get specified attribute value of an element
 */

const puppeteer = require("puppeteer");

const basilGetElement = async (args) => {
  const {parallel, input, output, script} = args; // Passed from index.js containing specifics for the scrape
  const inputPath = input.match(/\.\.\//) ? input : '../' + input;
  const arrPages = require(inputPath);
  const parallelBatches = Math.ceil(arrPages.length / parallel);
  const confEl = script.params.find(e => e.key == 'element').value;
  const confAttr = script.params.find(e => e.key == 'attribute').value;

  console.log(
    "Scraping " +
      arrPages.length +
      " pages for titles, in batches of " +
      parallel
  );

  console.log(" This will result in " + parallelBatches + " batches.");
  console.log('"timestamp","batch","index","URL","Value","Error"');

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
                let txtOut = await page.evaluate((el, a) => el.getAttribute(a), elHandle[0], confAttr);
                txtOut = txtOut.replace(/\n/g, "");
                console.log(
                  `"${timeStamp}","${k}","${j}","${arrPages[elem]}","${txtOut}",""`
                );
              } else {
                console.log(
                  `"${timeStamp}","${k}","${j}","${arrPages[elem]}","","ELEMENT NOT FOUND"`
                );
              }
            } catch (err) {
              throw new Error(err);
              /*
              // Report failing element and standard error response
              let timeStamp = new Date(Date.now()).toISOString();
              console.log(
                `"${timeStamp}","${k}","${j}","${arrPages[elem]}","","${err}"`
              );
              */
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
