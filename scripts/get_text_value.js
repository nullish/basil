/**
 * @name get text value of an element
 *
 * @desc Gets the text value of an element by using the page.$eval method
 *
 */
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: "new"})({headless: "new"})
  const page = await browser.newPage()
  await page.goto('https://news.ycombinator.com/news')
  const name = await page.$eval('.hnname > a', el => el.innerText)
  console.log(name)
  await browser.close()
})()
