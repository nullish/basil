# Basil
Puppeteer web scraper bundled with a selection of scripts for a variety of use cases.

Built on [Puppeteer](https://github.com/puppeteer/puppeteer)

## Installation

Clone the repo by your preferred method. From the root of the repo run: 

```bash
npm install
```

## Usage

Here's how to manage configurations, run scripts, and handle output.

### Configuration file

Basil runs Puppeteer scripts to scrape web data from a configuration file. The configuration file tells Basil:

* how many browser instances to launch
* how it should acquire a list of URLs to scrape
* which script to run
* what elements specific to that script it should look for

The configuration file comprises an array of JavaScript objects, each one is a configuration which can be selected to run with given parameter. 

It is stored in: `./config.json`

The format of a single configuration is:

```json
{
    "configName": "gtm-data-layer",
    "parallel": 8,
    "output": "output/file.csv",
    "input": "input/file.csv",
    "urlSitemap": "https://example.com/sitemap",
    "pageList": {
        "startUrl": "https://www.shu.ac.uk/courses?page=100&perPage=5&query=&yearOfEntry=2024%2F25",
        "linkSelector": "::-p-xpath(//a[@class='m-snippet__link'])",
        "moreItems": "(//button[contains(@aria-label, 'Go to page') and .//span[contains(@class, 'chevron--right')]])[1]"
    },
    "scrollList": {
        "startUrl": "https://blog.justinmallone.com/tag/microblog/",
        "linkSelector": "a.post-card-content-link",
        "maxScrolls": 10
    },
    "script": {
        "name": "gtmDataLayer",
        "params": 
        [
            {"key": "containerID", "value": "GTM-YOURID"},
            {"key": "gtmAttributeName", "value": "pageID"}
        ]
    }
}
```

This comprises:

| Attribute name | Description                                                 | Optional / mandatory |
|----------------|-------------------------------------------------------------|----------------------|
| configName     | **String:** name for the config used to select the config to run  | M                    |
| parallel       | **Integer:** the number of Chrome instances to launch at once. The recommendation is one. | M |
| output         | **String:** file path to save results. Default is `output/webscrape.csv` | O |
| input          | **String:** file path of a single column CSV of URLs to scrape | O |
| urlSitemap     | **String:** URL for a sitemap to use for a list of URLs to scrape | O |
| pageList       | **Object:** details of a page with links to acquire for scraping. _startUrl_: page to begin. _linkSelector_: DOM elements containing link value to scrape. _moreItems_: element to click to move to next page | O |
| scrollList     | **Object:** details of page that uses lazy load scrolling, with links to acquire for scraping.  _startUrl_: page to begin. _linkSelector_: DOM elements containing link value to scrape. _maxScrolls:_ maximum attempts at scrolling for more items. | O |
| script         | **Object:** name of the script to run and parmaters specific to the scrpt. | M |

Only one of _input_, _urlSitemap_, _pageList_, or _scrollList_ needs to be present, but all can be included, and the resulting list of unique URLs will be scraped.

### How to run a script

Execute:

```bash
npm run basil <configName>
```

This will instruct Basil to select the configuration with that name from `./config.json` and run a web scrape using all the input sources the configuration specifies. The output will be logged to STDOUT and , by default, `output/webscrape.csv`.

### Example configurations

These examples are taken from [`./sample-config.json`](./sample-config.json)

#### Count headings

```json
{
    "configName": "count-headings",
    "parallel": 8,
    "input": "input/sitemap.csv",
    "urlSitemap": "https://www.shu.ac.uk/sitemap",
    "script": {
        "name": "checkForElement",
        "params": [
            {
                "key": "element",
                "value": "//li/a[contains(@class, 'pill')]"
            }
        ]
    }
}
```