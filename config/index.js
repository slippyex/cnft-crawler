module.exports = {
  // threshold of trait in percent
  // if 5 that means, that the trait has to have a minimum of 5% in order to be considered
  threshold: 5,
  // minimum amount of traits with the above threshold in order to be considered valuable
  // if 3 that means, we have to have at least 3 traits with a minimum of 5% in rarity
  minTrigger: 3,
  // minimum price in ADA
  minPrice: 150,
  // maximum price in ADA
  maxPrice: 250,
  // maximum amount of pages to crawl - each page has an output of 25 items
  maxPages: 15
}
