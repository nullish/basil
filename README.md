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
        "startUrl": "https://www.example.com/courses",
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
| parallel       | **Integer:** the number of Chrome instances to launch at once. An upper limit of 8 is recommended. | M |
| output         | **String:** file path to save results. Default is `output/webscrape.csv` | O |
| input          | **String:** file path of a single column CSV of URLs to scrape | O |
| urlSitemap     | **String:** URL for a sitemap to use for a list of URLs to scrape | O |
| pageList       | **Object:** details of a page with links to acquire for scraping. <br><br>_startUrl_: page to begin. <br><br>_linkSelector_: DOM elements containing link value to scrape. <br><br>_moreItems_: element to click to move to next page | O |
| scrollList     | **Object:** details of page that uses lazy load scrolling, with links to acquire for scraping.  <br><br>_startUrl_: page to begin. <br><br>_linkSelector_: DOM elements containing link value to scrape. <br><br>_maxScrolls:_ maximum attempts at scrolling for more items. | O |
| script         | **Object:** name of the script to run and parmaters specific to the scrpt. | M |

Only one of _input_, _urlSitemap_, _pageList_, or _scrollList_ needs to be present, but all can be included, and the resulting list of unique URLs will be scraped.

### How to run a script

Execute:

```bash
npm run basil <configName>
```

This will instruct Basil to select the configuration with that name from `./config.json` and run a web scrape using all the input sources the configuration specifies. The output will be logged to STDOUT and , by default, `output/webscrape.csv`.

### Available scripts

All scripts are located in `scripts/`

| Name | Purpose |
|------|---------|
| checkForElement | Count instances of an element per page |
| cookiesAll | List all cookies downloaded by page |
| findTextAnywhere | Report instances of text anywhere in page |
| getElement | Report attribute of a chosen element by page |
| gtmDataLayer | Report instances of a Google Tag Manager data layer attribute by page |
| matchLinkArray | Report instances of links that match an array of links, by page |
| multiElement | Report an attribute for all instances of an element by page |
| redirects | Record last redirect and status code for supplied list of URLs |

### Script parameters

| Script name | Parameter name | Type | Description | Optional / Mandatory |
| ------------|----------------|------|-------------|--------|
| checkForElement | element | string | Element selector to check for | M |
| cookiesAll | N/A | N/A | N/A | N/A |
| findTextAnywhere | regexPattern | string | Regular expression to match page content | M |
| getElement | element | string | Element selector to check for | M |
| | attribute | string | Attribute value to report | O |
| gtmDataLayer | containerID | string | Google Tag Manager container ID | M |
| | gtmAttributeName | string | value to retrieve from GTM data layer | M |
| matchLinkArray | links | array | Array of links to match | M |
| multiElement | element | string | Element selector to check for | M |
| | attribute | string | Attribute value to report | O |
| redirects | N/A | N/A | N/A | N/A |

### Example configurations

These examples are taken from [`./sample-config.json`](./sample-config.json)

#### Count headings

```json
{
    "configName": "count-headings",
    "parallel": 8,
    "input": "input/sitemap.csv",
    "urlSitemap": "https://www.example.com/sitemap",
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

**Description:** Combine the URLs from a file called `input/sitemap.csv` and a sitemap at `https://www.example.com/sitemap` and report the number of instances of `//li/a[contains(@class, 'pill')]` per page in `output/webscrape.csv`.

#### All media URLs

```json
{
    "configName": "All media URLs",
    "parallel": 8,
    "urlSitemap": "https://www.example.com/sitemap",
    "script": {
        "name": "multiElement",
        "params": 
        [
            {"key": "element", "value": "a[href*=\"https://www.example.com/-/media/\"]"}
        ]
    }
}
```

**Description:** Using the URLs in a sitemap at `https://www.example.com/sitemap` report all elements per page matching the selector `a[href*=\"https://www.example.com/-/media/\"]`.

#### Redirects from list

```json
{
    "configName": "redirectsFromList",
    "parallel": 8,
    "input": "input/short.csv",
    "listCrawl": {
        "startUrl": "https://www.example.com/list-of-links",
        "linkSelector": "::-p-xpath(//a[@class='m-snippet__link'])",
        "moreItems": "(//button[contains(@aria-label, 'Go to page') and .//span[contains(@class, 'chevron--right')]])[1]"
    },
    "script": {
        "name": "redirects",
        "params": []
    }
}
```

**Description:** Using a a list of URLs which combines an input file with the path `input/short.csv` and all the links at `https://www.example.com/list-of-links` with element selector `::-p-xpath(//a[@class='m-snippet__link'])`, report the last rediect and HTTP status code. Paginate through additional pages of URLs while ever the 'more items' selector `(//button[contains(@aria-label, 'Go to page') and .//span[contains(@class, 'chevron--right')]])[1]` is found.

#### Match array of links

```json
{
    "configName": "linkArray",
    "parallel": 8,
    "input": "input/file.csv",
    "script": {
        "name": "matchLinkArray",
        "params": [
        {
            "key": "links",
            "value": [
                "https://www.example.com/about-this-website",
                "https://www.example.com/study-here/apply",
                "https://www.example.com/about-us/who-we-are",
                "https://www.example.com/about-us/our-values/sustainability"
        ]}
        ]
    }
}
```

**Description:** Using a list of URLs from the file `input/file.csv` report all instances per page of links matching the given array.

### Get headings from lazy loading link list

```json
{
    "configName": "eg-lazyload",
    "parallel": 8,
    "input": "",
    "scrollList": {
        "startUrl": "https://blog.justinmallone.com/tag/microblog/",
        "linkSelector": "a.post-card-content-link",
        "maxScrolls": 10
    },
    "script": {
        "name": "getElement",
        "params": 
        [
            {"key": "element", "value": "//h1"},
            {"key": "attribute", "value": "innerText"}
        ]
    }
}
```

**Description:** Using a list of URLs extracted from the URL `https://blog.justinmallone.com/tag/microblog/` matching element selector `a.post-card-content-link`, report the `h1` inner text value for rach URL. Scroll down the list of links for a maximum of 10 scroll actions.
