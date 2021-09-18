const axios = require('axios');
const fs = require('fs');
const _ = require('lodash');
const helpers = require('../utils/helpers');

/**
 * crawls through results of a given project (ordered by price asc)
 * and, if available, directly estimates the current value of an
 * offered item based on a rarity chart (see drop-in folder)
 *
 * @param config
 * @param extraData
 * @returns {Promise<void>}
 */
module.exports = async (config, extraData) => {
  let rarityChart = {};

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
      `we found a rarity chart for project ${config.project} - using it to derive overall rarity now`
    );
  } catch (err) {
    console.log(
      `no rarity chart found for project ${config.project} - continuing without evaluation`
    );
    if (config.filter && config.filter.toLowerCase() === 'rarity') {
      config.filter = 'all';
    }
  }
  try {
    const query = `${config.queryPrefix}&page=1`;

    const res = await axios.post(`https://api.cnft.io/market/listings`, query);
    const found = res.data.found;
    let pages = _.round(
      parseFloat(found) / 25 > config.maxPages
        ? config.maxPages
        : parseFloat(found) / 25
    );
    for (let page = 1; page <= pages; page++) {
      console.log(`crawling page ${page} of ${pages}`);
      const crawlingResults = await crawlPageData(
        page,
        config,
        extraData,
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
      presentData(filteredResults, config.fakes);
    }
  } catch (err) {
    if (err.data) {
      console.log(err.data);
    } else {
      console.error(err);
    }
  }
};

/**
 *
 * @param page
 * @param config
 * @param extraData
 * @param rarityChart
 * @returns {Promise<*[]>}
 */
const crawlPageData = async (page, config, extraData, rarityChart) => {
  const query = `${config.queryPrefix}&page=${page}`;

  const res = await axios.post(`https://api.cnft.io/market/listings`, query);
  const processedResults = [];
  for (const entry of res.data.assets) {
    const processedItem = helpers.transformEntry(
      config.project,
      entry,
      extraData
    );

    if (config.unverified && config.policy) {
      processedItem.policyVerified = config.policy === entry.policy;
    }
    // checks, if rarity chart is available for the project
    // if not, we can still try to evaluate based on a provided
    // "extraTags" configuration

    helpers.estimateRarity(processedItem, config, rarityChart);

    if (processedItem.worthChecking) {
      processedItem.link = `at least ${config.minTrigger + 1} items below ${
        config.threshold
      }% - considered worth checking under: https://cnft.io/token.php?id=${
        entry.id
      }`;
    } else if (processedItem.exceptional) {
      processedItem.link = `match in given item - considered worth checking under: https://cnft.io/token.php?id=${entry.id}`;
    }
    processedResults.push(processedItem);
  } // end-for assets
  return processedResults;
};

const presentData = (filteredResults, fakeCheck) => {
  for (const entry of filteredResults) {
    console.log(
      `${entry.name} - price ${entry.price} ADA ${
        entry.overallRarity > 0
          ? '- overall rarity ' + entry.overallRarity + '%'
          : ''
      }`
    );
    if (fakeCheck && !entry.policyVerified) {
      console.log(`!!!! ITEM HAS BEEN DETECTED AS FAKE - WRONG POLICY !!!!`);
    }
    for (const trait of entry.traits) {
      console.log(
        `\t${trait.name}: ${trait.value} ${trait.exceptional ? '!!!' : ''} ${
          trait.percentage ? trait.percentage + '%' : ''
        } ${trait.valuable ? '***' : ''}`
      );
    }
    if (entry.link) {
      console.log(entry.link);
    }
    console.log(`============================`);
  }
};
