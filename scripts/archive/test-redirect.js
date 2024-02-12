

const puppeteer = require('puppeteer');
const lastRedirect = require('last-redirect');

(async () => {
  const browser = await puppeteer.launch({headless: "new"})({});
  const page = await browser.newPage()
  const res = await page.goto('http://www.google.com', { waitUntil: 'networkidle2' })
  console.log(lastRedirect(res));
  await browser.close()
})()
