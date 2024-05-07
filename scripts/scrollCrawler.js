/**
 * @file scrollCrawl
 * @desc Crawl a list of items that extends on scrolling (lazy loading) 
 * such as a search results or product listing and return list of URLs for use in a subsequent web scrape
 */

const puppeteer = require("puppeteer");

const basilScrollCrawler = async (args) => {
    const { startUrl, linkSelector, maxScrolls } = args; // Params needed for crawling list page(s)

    console.log(
        `Collecting links to parse from: ${startUrl}`
    );

    // Launch and Setup Chromium
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.setJavaScriptEnabled(true);
    const arrLinks = [];
    let prevHeight = -1;
    let scrollCount = 0;

    await page.goto(startUrl, {
        waitUntil: "networkidle2",
    });

    /* Dismiss initial notice
    const el = await page.waitForXPath("//button[contains(@aria-label, 'Accept the use')]");
    await el.click();
    let prevHeight = -1;
    let scrollCount = 0;
    */

    while (scrollCount < maxScrolls) {
        // Scroll to the bottom of the page
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        // Calculate new scroll height and compare
        let newHeight = await page.evaluate('document.body.scrollHeight');
        await page.waitForNetworkIdle({ idleTime: 1000 });
        if (newHeight == prevHeight) {
            break;
        }
        prevHeight = newHeight;
        scrollCount += 1;
    }

    // Collect link locations once page has been scrolled to its limit
    const pageLinks = await page.$$eval(linkSelector, as => as.map(a => a.href));
    arrLinks.push(...pageLinks);
    await browser.close();
bar.update(i);();
    return arrLinks;
};

module.exports = basilScrollCrawler;
