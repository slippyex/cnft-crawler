const axios = require('axios');
const _ = require('lodash');
const rarityChart = require('./rarities/claynation.json');
const config = require('./config');

// const threshold = 5;
// const minTrigger = 3;
// const minPrice = 50;
// const maxPrice = 100;
// const maxPages = 15;
const queryPrefix = `sort=price&order=asc&&project=Clay+Nation+by+Clay+Mates&verified=true`;

const estimateRarity = (stats, name) => {
    const collect = [];
    const statsCollect = [];
    delete stats.Project;
    const rare = [];
    for (const stat of Object.keys(stats)) {
      const key = stat.toLowerCase();
      const block = rarityChart[key];
      const itemValue = stats[stat];
      const val = Number.parseInt(block[itemValue], 10);
      const percentage = (val / 100);
      if (percentage <= config.threshold) {
        rare.push({stat, itemValue});
      }
      statsCollect.push(`\t${stat}: ${itemValue} (${percentage}%) ${percentage <= config.threshold ? '***' : ''}`);
      collect.push(percentage);
    }
    if (rare.length > config.minTrigger) {
      console.log(`${name} >> overall rarity ->> ${_.round(_.mean(collect))}%`);
      statsCollect.forEach((o) => console.log(o));
    }
    return rare.length > config.minTrigger;
}

const crawlData = async (page) => {
  const query = `${queryPrefix}&page=${page}&pricemin=${config.minPrice}&pricemax=${config.maxPrice}`;

  const res = await axios.post(`https://api.cnft.io/market/listings`, query);
  for (const entry of res.data.assets) {
    const header = `${entry.metadata.name} - price ${entry.price / 1000000} ADA`;
    const statsObj = {};
    for (const stat of entry.metadata.tags) {
      const name = Object.keys(stat)[0];
      statsObj[name] = stat[name];
    }
    const worthChecking = estimateRarity(statsObj, header);
    if (worthChecking) {
      console.log(`at least ${config.minTrigger + 1} items below ${config.threshold}% - considered worth checking under: https://cnft.io/token.php?id=${entry.id}`);
    }
  }
}
(async function() {
  try {
    const query = `${queryPrefix}&page=1&pricemin=${config.minPrice}&pricemax=${config.maxPrice}`;

    const res = await axios.post(`https://api.cnft.io/market/listings`, query);
    const found = res.data.found;
    const pages = parseFloat(found) / 25 > config.maxPages ? config.maxPages : parseFloat(found) / 25;
    for (let page = 1; page <=pages; page++) {
      await crawlData(page);
    }
  } catch (err) {
    console.log(err.data);
  }
})();
