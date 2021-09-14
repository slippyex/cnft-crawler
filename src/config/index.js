module.exports = {
  // project to crawl (as shown on cnft.io projects list)
  project: 'Clay Nation by Clay Mates',
  //  project: 'Bitlands',
  // threshold of trait in percent
  // if 5 that means, that the trait has to have a minimum of 5% in order to be considered
  threshold: 4,
  // minimum amount of traits with the above threshold in order to be considered valuable
  // if 3 that means, we have to have at least 3 traits with a minimum of 5% in rarity
  minTrigger: 5,
  // if any of the given extra tags is found in the traits, we consider the item
  // valuable, regardless of the percent coverage above
  extraTags: [
    'blue clay',
    'green clay',
    'laser eyes',
    'duck',
    'angel wings',
    'orangutan'
  ],
  //  extraTags: ['rare'],
  // filters results just based on the given rarity criteria
  filter: 'rarity',
  // minimum price in ADA
  minPrice: 400,
  // maximum price in ADA
  maxPrice: 800,
  // maximum amount of pages to crawl - each page has an output of 25 items
  maxPages: 15
};
