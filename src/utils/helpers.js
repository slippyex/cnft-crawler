const axios = require('axios');
const _ = require('lodash');
const fs = require('fs');
let extraData = {};

/**
 * tries to estimate the value of a given trait collection
 * per item, based on a rarity chart (see drop-in folder)
 *
 * @param processedItem
 * @param config
 * @param rarityChart
 * @returns {{traits: *[], name}}
 */
const estimateRarity = (processedItem, config, rarityChart) => {
  let exceptional = false;
  let valuable = 0;

  const collectPercentage = [];
  processedItem.traits = [];
  for (const stat of Object.keys(processedItem.stats)) {
    const key = stat.toLowerCase();
    const itemValue = processedItem.stats[stat];
    const trait = {name: stat, value: itemValue};

    // in case we have a rarity chart, use it to determine value
    if (rarityChart) {
      const rarityBlock = rarityChart[key];
      if (rarityBlock && _.isNumber(rarityBlock[itemValue])) {
        const val = Number.parseInt(rarityBlock[itemValue], 10);
        const percentage = val / 100;
        collectPercentage.push(percentage);
        if (percentage <= config.threshold) {
          valuable++;
        }
        trait.percentage = percentage;
        trait.valuable = percentage <= config.threshold;
      }
      // but in any case check for the extraTags
      if ((config.extraTags || []).length > 0) {
        trait.exceptional = config.extraTags
          .map((o) => o.toLowerCase())
          .includes(itemValue.toLowerCase());
        if (!exceptional && trait.exceptional) {
          exceptional = true;
        }
      }
      processedItem.traits.push(trait);
    }
  }
  processedItem.worthChecking = valuable >= config.minTrigger;
  processedItem.exceptional = exceptional;
  processedItem.overallRarity =
    collectPercentage.length > 0 ? _.round(_.mean(collectPercentage)) : 0;
  delete processedItem.stats;
  return processedItem;
};

/**
 *
 * @param page
 * @param config
 * @param queryPrefix
 * @param rarityChart
 * @returns {Promise<*[]>}
 */
module.exports.crawlData = async (page, config, queryPrefix, rarityChart) => {
  const query = `${queryPrefix}&page=${page}`;

  const res = await axios.post(`https://api.cnft.io/market/listings`, query);
  const processedResults = [];
  for (const entry of res.data.assets) {
    const processedItem = {
      price: entry.price / 1000000,
      name: entry.metadata.name,
      stats: {},
      worthChecking: false,
      exceptional: false,
      overallRarity: 0
    };

    for (const stat of entry.metadata.tags) {
      const name = Object.keys(stat)[0];
      if (_.isObject(stat[name])) {
        const nested = _.get(stat[name], 'items');
        if (nested) {
          for (const itm of Object.keys(nested)) {
            processedItem.stats[itm] = nested[itm];
          }
        } else {
          processedItem.stats[name] = stat[name];
        }
      } else {
        processedItem.stats[name] = stat[name];
      }
    }

    // for nifty-teddy project, we want to add rarity to a gathered item
    if (config.project === 'NiftyTeddy') {
      if (Object.keys(extraData).length === 0) {
        const tmp = fs
          .readFileSync(
            `${__dirname}/../../rarities/NiftyTeddy/rarity_per_item.json`
          )
          .toString();
        extraData = JSON.parse(tmp);
      }
      processedItem.stats.rarity = extraData[entry.metadata.name];
    } // end-if NiftyTeddy
    delete processedItem.stats.Project;
    delete processedItem.stats.arweaveId;
    delete processedItem.stats.uid;

    // checks, if rarity chart is available for the project
    // if not, we can still try to evaluate based on a provided
    // "extraTags" configuration

    estimateRarity(processedItem, config, rarityChart);

    if (processedItem.worthChecking) {
      processedItem.link = `at least ${config.minTrigger + 1} items below ${
        config.threshold
      }% - considered worth checking under: https://cnft.io/token.php?id=${
        entry.id
      }`;
    }
    processedResults.push(processedItem);
  } // end-for assets
  return processedResults;
};
