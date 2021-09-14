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
};


