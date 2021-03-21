

const puppeteer = require('puppeteer');
const lastRedirect = require('last-redirect');

(async () => {
  const browser = await puppeteer.launch({});
  const page = await browser.newPage()
  const res = await page.goto('https://www.shu.ac.uk/', { waitUntil: 'networkidle2' })
  console.log(lastRedirect(res).status);
  await browser.close()
})()
