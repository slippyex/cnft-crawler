const _ = require('lodash');

/**
 * tries to estimate the value of a given trait collection
 * per item, based on a rarity chart (see drop-in folder)
 *
 * @param processedItem
 * @param config
 * @param rarityChart
 * @returns {{traits: *[], name}}
 */
module.exports.estimateRarity = (processedItem, config, rarityChart) => {
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
        for (const et of config.extraTags) {
          if (String(itemValue).toLowerCase().indexOf(et.toLowerCase()) !== -1) {
            trait.exceptional = true;
          }
        }
        if (!exceptional && trait.exceptional) {
          exceptional = true;
        }
      }
      processedItem.traits.push(trait);
    }
  }
  processedItem.worthChecking = valuable >= config.minTrigger;
  if ((config.extraTags || []).length > 0) {
    for (const et of config.extraTags) {
      if (processedItem.name.toLowerCase().indexOf(et.toLowerCase()) !== -1) {
        exceptional = true;
        break;
      }
    }
  }
  processedItem.exceptional = exceptional;
  processedItem.overallRarity =
    collectPercentage.length > 0 ? _.round(_.mean(collectPercentage)) : 0;
  delete processedItem.stats;
};

/**
 * transforms an entry from cnft into a crawler-specific format
 *
 * @param project
 * @param entry
 * @param extraData
 * @returns {{overallRarity: number, stats: {}, price: number, exceptional: boolean, name, worthChecking: boolean}}
 */
module.exports.transformEntry = (project, entry, extraData) => {
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
 //   processedItem.name = name;
    if (name === 'Race') {
      processedItem.stats.race = stat[name][0];
    }
    unnestObject(stat[name], name, processedItem);
  }

  // for nifty-teddy project, we want to add rarity to a gathered item
  if (project === 'NiftyTeddy') {
    processedItem.stats.rarity = extraData[entry.metadata.name];
  } // end-if NiftyTeddy

  delete processedItem.stats.Project;
  delete processedItem.stats.arweaveId;
  delete processedItem.stats.uid;
  return processedItem;
};

/**
 * deep-un-nests a given project item
 * regardless of the nested attributes names
 *
 * @param stat
 * @param name
 * @param processedItem
 */
const unnestObject = (stat, name, processedItem) => {
  if (_.isObject(stat)) {
    for (const itm of Object.keys(stat)) {
      const nested = stat[itm];
      if (_.isObject(nested)) {
        // recursively call the same
        // if we find an object here
        unnestObject(nested, itm, processedItem);
      } else {
        // filter out undefined or empty attributes
        if (stat[itm] || '') {
          processedItem.stats[itm] = stat[itm];
        }
      }
    }
  } else {
    // filter out undefined or empty attributes
    processedItem.stats[name] = stat;
  }
}
