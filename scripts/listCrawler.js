/**
 * @file listCrawl
 * @desc Crawl a list of items such as a search results or product listing and return list of URLs for use in a subsequent web scrape
 */


/** @todo Return an array of URLs when completed
 * Integrate into other scraping scripts as supplier of input
 */
const puppeteer = require("puppeteer");
const fs = require('fs');

const basilListCrawler = async (args) => {
  const { startUrl, linkSelector, moreItems } = args; // Params needed for crawling list page(s)

  console.log(
    `Collecting links to parse from: ${startUrl}`
  );

  // Launch and Setup Chromium
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  page.setJavaScriptEnabled(true);
  const arrLinks = [];
  let hasMorePages = true; // Toggle to check whether to scrape a new page of links

  await page.goto(startUrl, {
    waitUntil: "networkidle2",
  });

  const scrapeList = async () => {
    const pageLinks = await page.$$eval(linkSelector, as => as.map(a => a.href));
    //let arrOut = await pageLinks.map(e => e[0]);
    arrLinks.push(...pageLinks);
  };

  await scrapeList();

  while (hasMorePages) {
    try {
      hasMorePages = await page.waitForXPath(moreItems);  
    } catch (error) {
      hasMorePages = false;
    };
    if (hasMorePages) {
      await hasMorePages.click();
      await page.waitForNetworkIdle({idleTime: 1000});
      await scrapeList();
    };
  };

  await browser.close();
  return arrLinks;
};

module.exports = basilListCrawler;

/*
basilListCrawl({
  startUrl: "https://www.shu.ac.uk/courses?page=100&perPage=5&query=&yearOfEntry=2024%2F25",
  linkSelector: "::-p-xpath(//a[@class='m-snippet__link'])",
  moreItems: "(//button[contains(@aria-label, 'Go to page') and .//span[contains(@class, 'chevron--right')]])[1]",
});
*/
