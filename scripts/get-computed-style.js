/**
 * @name getComputedStyle
 *
 * @desc Get computed styles for all elements on webpage
 *
 */
 const puppeteer = require('puppeteer');

 (async () => {
 	const browser = await puppeteer.launch()
 	const page = await browser.newPage()
 	// navigate to target page
 	await page.goto('https://tutorial.tips');
	// get styles of element
	const themeSwitcherStyles = await page.$eval('button[role="switch"]', el => {
		/* REINSTATE BELOW LINE IF YOU ONLY WANT A SPECIFIC ELEMENT
		// getComputedStyle(el).getPropertyValue('background-image')
		*/
		const stylesObject = getComputedStyle(el);
		const styles = {};
		for (const prop in stylesObject) {
			if(stylesObject.hasOwnProperty(prop)) {
				styles[prop] = stylesObject[prop]
			}
		}
		return styles;
	})
	console.log(themeSwitcherStyles)
	// close the browser
	await browser.close();
})();