const floorPrice = require('./lib/gatherFloorPrice');
const crawler = require('./lib/crawler');
const cliParser = require('./utils/cliParser');

(async function () {

  const config = cliParser();
  // either check the floor price of a project or crawl the same
  if (config.floor) {
    await floorPrice(config);
  } else {
    await crawler(config);
  }
  process.exit(0);

})();
