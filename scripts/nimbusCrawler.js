/**
 * @file nimbusCrawler
 * @desc Crawl a list of items that extends on scrolling (lazy loading)
 * general script adjusted for specific use with Nimbus note web portal and including login steps
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const url = require("url");
const nimUserId = process.env["NIMBUS_USER"];

const basilNimbusCrawler = async (args) => {
  const { startUrl, linkSelector, maxScrolls } = args; // Params needed for crawling list page(s)
  // Get nimbus credentials from .env
  const nimUser = process.env["NIMBUS_EMAIL"];
  const nimPassword = process.env["NIMBUS_PASSWORD"];
  const nimCookie = process.env["NIMBUS_COOKIE"];
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

  // Set the download path
  const downloadPath = path.resolve("./downloads");
  fs.mkdirSync(downloadPath, { recursive: true });

  // Enable request interception
  await page.setRequestInterception(true);

  
  page.on("request", (request) => {
    // Continue all requests
    request.continue();
  });

  page.on("response", async (response) => {
    const requestUrl = response.url();

    // Check if the response is a file download (adjust the condition as needed)
    if (
      response.request().resourceType() === "document" &&
      requestUrl.startsWith("https://fvd-temp-files.s3.amazonaws.com")
    ) {
      // Adjust for your file type
      const fileName = path.basename(url.parse(requestUrl).pathname);
      const filePath = path.resolve(downloadPath, fileName);

      // Save the response buffer to a file
      const buffer = await response.buffer();
      fs.writeFileSync(filePath, buffer);
      console.log(`File downloaded to: ${filePath}`);
    }
  });

  // Hit arbitrary start page
  await page.goto("https://www.example.com", {
    waitUntil: "networkidle2",
  });

  await page.setCookie({
    name: "eversessionid",
    domain: ".nimbusweb.me",
    value: nimCookie,
    path: "/",
    expires: 1758444913,
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
  activeNoteText = await page.$eval(
    ".note-title--container h1",
    (e) => e.innerText
  );

  await page.waitForSelector("svg-icon[icon='more']");
  await page.click("svg-icon[icon='more']");
  await page.waitForSelector("::-p-aria(Export page)");
  await page.click("::-p-aria(Export page)");
  await page.waitForSelector("svg-icon[icon='export-html']");
  await page.click("svg-icon[icon='export-html']");
  await page.waitForSelector(".nimbus-popup-actions > button");
  await page.click(".nimbus-popup-actions > button");

  await page.keyboard.down("ArrowDown");
  activeNote = await page.waitForSelector(".note-title--container h1");
  activeNoteText = await page.$eval(
    ".note-title--container h1",
    (e) => e.innerText
  );

  console.log("next note");
};

// module.exports = basilScrollCrawler;
// basilNimbusCrawler({startUrl: "https://nimbusweb.me/auth/?t=regfsour:header&booking-flow=1"});
basilNimbusCrawler({ startUrl: `https://${nimUserId}.nimbusweb.me/client` });
