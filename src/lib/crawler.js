const axios = require('axios');
const fs = require('fs');
const helpers = require('./helpers');
const _ = require('lodash');

/**
 * crawls through results of a given project (ordered by price asc)
 * and, if available, directly estimates the current value of an
 * offered item based on a rarity chart (see drop-in folder)
 *
 * @param config
 * @returns {Promise<void>}
 */
module.exports = async (config) => {
  let rarityChart = {};
  const queryPrefix = config.queryPrefix;
  console.log(
    `entering cnft crawler with config: \n${JSON.stringify(config, null, 2)}`
  );

  try {
    // checks for a rarity chart drop-in for the given project
    rarityChart = JSON.parse(
      fs
        .readFileSync(
          `${__dirname}/../../rarities/${config.project}/rarity_chart.json`
        )
        .toString()
    );

    console.log(
      `we found a rarity chart for project ${
        config.project} - using it to derive overall rarity now`
    );
  } catch (err) {
    console.log(
      `no rarity chart found for project ${
        config.project} - continuing without evaluation`
    );
    if (config.filter && config.filter.toLowerCase() === 'rarity') {
      config.filter = 'all';
    }
  }
  try {
    const query = `${queryPrefix}&page=1`;

    const res = await axios.post(`https://api.cnft.io/market/listings`, query);
    const found = res.data.found;
    let pages = _.round(
      parseFloat(found) / 25 > config.maxPages
        ? config.maxPages
        : parseFloat(found) / 25
    );
    for (let page = 1; page <= pages; page++) {
      console.log(`crawling page ${page} of ${pages}`);
      const crawlingResults = await helpers.crawlData(
        page,
        config,
        queryPrefix,
        rarityChart
      );
      let filteredResults = crawlingResults;
      if (
        config.filter &&
        ['rarity', 'extratags'].includes(config.filter.toLowerCase())
      ) {
        filteredResults = crawlingResults.filter((o) =>
          config.filter === 'rarity' ? o.worthChecking : o.exceptional
        );
      }
      for (const entry of filteredResults) {
        console.log(`${entry.name} - price ${entry.price} ADA`);
        for (const trait of entry.traits) {
          console.log(
            `\t${trait.name}: ${trait.value} ${
              trait.exceptional ? '!!!' : ''
            } ${trait.percentage ? trait.percentage + '%' : ''} ${
              trait.valuable ? '***' : ''
            }`
          );
        }
        if (entry.link) {
          console.log(entry.link);
        }
        console.log(`============================`);
      }
    }
  } catch (err) {
    if (err.data) {
      console.log(err.data);
    } else {
      console.error(err);
    }
  }
};
