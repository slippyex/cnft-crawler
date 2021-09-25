const axios = require('axios');
const fs = require('fs');
const _ = require('lodash');
const helpers = require('../utils/helpers');
const chalk = require('chalk');

/**
 * crawls through results of a given project (ordered by price asc)
 * and, if available, directly estimates the current value of an
 * offered item based on a rarity chart (see drop-in folder)
 *
 * @param config
 * @param extraData
 * @param returnResults
 * @param progress
 * @return
 */
module.exports = async (config, extraData, returnResults, progress) => {
  let rarityChart = {};
  let rarityScores = {};

  if (!returnResults) {
    console.log(
      `entering cnft crawler with config: \n${JSON.stringify(config, null, 2)}`
    );
  }

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
    // checks for a rarity chart drop-in for the given project
    rarityScores = JSON.parse(
      fs
        .readFileSync(
          `${__dirname}/../../rarities/${config.project}/rarity_ranks.json`
        )
        .toString()
    );

    console.log(
      `we found a rarity score/rank for project ${config.project} - using it to derive overall rarity now`
    );
  } catch (err) {
    console.log(
      `no rarity score/rank lookup found for project ${config.project} - continuing without evaluation`
    );
    // if (config.filter && config.filter.toLowerCase() === 'rarity') {
    //   config.filter = 'all';
    // }
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
    let progressBar = null;
    if (progress) {
      progressBar = new progress(pages);
    }
    const collectReturnedPages = [];
    for (let page = 1; page <= pages; page++) {
      if (progressBar) {
        process.stdout.write('\rcrawling in progress: ' + progressBar.update(page, pages));
      } else {
        console.log(`crawling page ${page} of ${pages}`);
      }
      const crawlingResults = await crawlPageData(
        page,
        config,
        extraData,
        rarityChart,
        rarityScores
      );
      let filteredResults = crawlingResults;
      if (config.top && Object.keys(rarityScores).length > 0) {
        filteredResults = crawlingResults.filter((o) => o.rarityRank !== -1 && o.rarityRank <= config.top);
      } else if (
        config.filter &&
        ['rarity', 'extratags'].includes(config.filter.toLowerCase())
      ) {
        filteredResults = crawlingResults.filter((o) =>
          config.filter === 'rarity' ? o.worthChecking : o.exceptional
        );
      }
      if (!returnResults) {
        presentData(filteredResults, config.fakes);
      } else {
        collectReturnedPages.push(filteredResults);
      }
    }
    return collectReturnedPages;
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
 * @param rarityScore
 * @returns {Promise<*[]>}
 */
const crawlPageData = async (page, config, extraData, rarityChart, rarityScore) => {
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

    if (Object.keys(rarityScore).length > 0) {
      const rankScore = rarityScore[processedItem.name];
      processedItem.rarityScore = (rankScore || {score: -1}).score;
      processedItem.rarityRank = (rankScore || {rank: -1}).rank;
    }
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
      chalk`${entry.name} - price {red {bold ${entry.price} ADA}} {yellow ${
        entry.rarityScore > -1 ? '- score: ' + entry.rarityScore : ''}${
        entry.rarityRank > -1 ? ' - rank: ' + entry.rarityRank : ''
      }}${
        entry.overallRarity > 0
          ? ' - overall rarity ' + entry.overallRarity + '%'
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
module.exports.presentData = presentData;
