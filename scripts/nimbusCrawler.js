/**
 * @file nimbusCrawler
 * @desc Crawl a list of items that extends on scrolling (lazy loading)
 * general script adjusted for specific use with Nimbus note web portal and including login steps
 */

const puppeteer = require("puppeteer");
const nimUserId = process.env['NIMBUS_USER'];

const basilNimbusCrawler = async (args) => {
  const { startUrl, linkSelector, maxScrolls } = args; // Params needed for crawling list page(s)
  // Get nimbus credentials from .env
  const nimUser = process.env['NIMBUS_EMAIL'];
  const nimPassword = process.env['NIMBUS_PASSWORD'];
  const nimCookie = process.env['NIMBUS_COOKIE'];
  const cssUser = "input[name='login'].form_error_field";
  const cssPassword = "#form_login input[type='password']";
  console.log(`Collecting links to parse from: ${startUrl}`);

  // Launch and Setup Chromium
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.setJavaScriptEnabled(true);
  const arrLinks = [];
  let prevHeight = -1;
  let scrollCount = 0;

  // Hit arbitrary start page
  await page.goto("https://www.example.com", {
    waitUntil: "networkidle2",
  });

  await page.setCookie({
    name: 'eversessionid',
    domain: '.nimbusweb.me',
    value: nimCookie,
    path: '/',
    expires: 1758444913
  });

  // Hit nimbus login screen
  await page.goto(startUrl, {
    waitUntil: "networkidle2",
  });

  
  /*
  // Populate login fields
  let elUser = await page.waitForSelector(cssUser);
  await page.type(cssUser, nimUser, { delay: 120});
  let elPassword = await page.waitForSelector(cssPassword);
  await page.type(cssPassword, nimPassword, { delay: 120});
  let elSubmit = await page.waitForSelector("#form_login form > button > span");
  await elSubmit.click();
  */

  // Test for first list item and click it
  const cssNote = ".notes-list-item-wrapper";
  await page.waitForSelector(cssNote);
  await page.click(cssNote);
  const arrNotes = [];
  let activeNote, activeNoteText;
  activeNote = await page.waitForSelector(".note-title--container h1");
  activeNoteText = await page.$eval(".note-title--container h1", (e) => e.innerText);
  await page.keyboard.down('ArrowDown');
  activeNote = await page.waitForSelector(".note-title--container h1");
  activeNoteText = await page.$eval(".note-title--container h1", (e) => e.innerText);

  console.log('next note');
  while (scrollCount < maxScrolls) {
    // Scroll to the bottom of the page
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    // Calculate new scroll height and compare
    let newHeight = await page.evaluate("document.body.scrollHeight");
    await page.waitForNetworkIdle({ idleTime: 1000 });
    if (newHeight == prevHeight) {
      break;
    }
    prevHeight = newHeight;
    scrollCount += 1;
  }

  // Collect link locations once page has been scrolled to its limit
  const pageLinks = await page.$$eval(linkSelector, (as) =>
    as.map((a) => a.href),
  );
  arrLinks.push(...pageLinks);
  await browser.close();
  return arrLinks;
};

// module.exports = basilScrollCrawler;
// basilNimbusCrawler({startUrl: "https://nimbusweb.me/auth/?t=regfsour:header&booking-flow=1"});
basilNimbusCrawler({startUrl: `https://${nimUserId}.nimbusweb.me/client`});

