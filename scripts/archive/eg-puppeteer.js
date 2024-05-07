const puppeteer = require("puppeteer");

let bookingUrl =
  "https://www.booking.com/searchresults.en-gb.html?label=gen173nr-1FCAEoggI46AdIM1gEaFCIAQGYAQm4AQfIAQzYAQHoAQH4AQuIAgGoAgO4ArPu3fEFwAIB&sid=f327eea9c7d45f0da3282fccf7f8832b&sb=1&sb_lp=1&src=index&src_elem=sb&error_url=https%3A%2F%2Fwww.booking.com%2Findex.en-gb.html%3Flabel%3Dgen173nr-1FCAEoggI46AdIM1gEaFCIAQGYAQm4AQfIAQzYAQHoAQH4AQuIAgGoAgO4ArPu3fEFwAIB%3Bsid%3Df327eea9c7d45f0da3282fccf7f8832b%3Bsb_price_type%3Dtotal%26%3B&sr_autoscroll=1&ss=Singapore%2C+Singapore&is_ski_area=&checkin_year=2020&checkin_month=2&checkin_monthday=3&checkout_year=2020&checkout_month=2&checkout_monthday=29&group_adults=2&group_children=0&no_rooms=1&b_h4u_keep_filters=&from_sf=1&ss_raw=singapo&ac_position=0&ac_langcode=en&ac_click_type=b&dest_id=-73635&dest_type=city&iata=SIN&place_id_lat=1.29045&place_id_lon=103.85204&search_pageview_id=1da10a59142200c2&search_selected=true&search_pageview_id=1da10a59142200c2&ac_suggestion_list_length=5&ac_suggestion_theme_list_length=0";
(async () => {
  const browser = await puppeteer.launch({ headless: "new" })({
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 926 });
  await page.goto(bookingUrl);

  // get hotel details
  let hotelData = await page.evaluate(() => {
    let hotels = [];
    // get the hotel elements
    let hotelsElms = document.querySelectorAll(
      "div.sr_property_block[data-hotelid]",
    );
    // get the hotel data
    hotelsElms.forEach((hotelelement) => {
      let hotelJson = {};
      try {
        hotelJson.name = hotelelement.querySelector(
          "span.sr-hotel__name",
        ).innerText;
        hotelJson.reviews = hotelelement.querySelector(
          ".bui-review-score__badge",
        ).innerText;
        if (hotelelement.querySelector(".bui-price-display__value")) {
          hotelJson.price = hotelelement.querySelector(
            ".bui-price-display__value",
          ).innerText;
        }
      } catch (exception) {}
      hotels.push(hotelJson);
    });
    return hotels;
  });
  console.dir(hotelData);
  await browser.close();
})();
