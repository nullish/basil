/**
 * @name Duck Duck Go search
 */

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: "new"})({ headless: false });
  const page = await browser.newPage()
  await page.goto('https://duckduckgo.com/', { waitUntil: 'networkidle2' })  
  await page.type('#search_form_input_homepage', 'Puppeteer')
  const searchValue = await page.$eval("//p[@class='badge-link__subtitle']", el => el.value)
  console.log(searchValue)
  await browser.close()
})()
