const floorPrice = require('./lib/gatherFloorPrice');
const crawler = require('./lib/crawler');
const cliParser = require('./utils/cliParser');
const fs = require('fs');
let extraData = {};

(async function () {
  const config = cliParser();
  if (config.project === 'NiftyTeddy') {
    if (Object.keys(extraData).length === 0) {
      const tmp = fs
        .readFileSync(
          `${__dirname}/../rarities/NiftyTeddy/rarity_per_item.json`
        )
        .toString();
      extraData = JSON.parse(tmp);
    }
  }

  // either check the floor price of a project or crawl the same
  if (config.floor) {
    await floorPrice(config, extraData);
  } else {
    await crawler(config, extraData);
  }
  process.exit(0);
})();
