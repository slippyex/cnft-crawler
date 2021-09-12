const axios = require('axios');
const fs = require('fs');
const _ = require('lodash');
let rarityChart = {};
let isEstimation = false;
const config = require('./config');

const queryPrefix = `sort=price&order=asc&&project=${config.project.replace(/ /g, '+')}&verified=true`;

const estimateRarity = (stats, name) => {
  const collect = [];
  const statsCollect = [];
  delete stats.Project;
  const rare = [];
  let exceptional = false;
  for (const stat of Object.keys(stats)) {
    const key = stat.toLowerCase();
    const block = rarityChart[key];
    const itemValue = stats[stat];
    const val = Number.parseInt(block[itemValue], 10);
    const percentage = (val / 100);
    if (percentage <= config.threshold) {
      rare.push({stat, itemValue});
    }
    statsCollect.push(`\t${stat}: ${itemValue} (${percentage}%) ${
      percentage <= config.threshold ? '***' : ''} ${
      config.extraTags.includes(itemValue.toLowerCase()) ? '!!!!!!' : ''}`);
    collect.push(percentage);

    if (!exceptional && config.extraTags.includes(itemValue.toLowerCase())) {
      exceptional = true;
    }
  }
  if (rare.length > config.minTrigger || exceptional) {
    console.log(`${name} >> overall rarity ->> ${_.round(_.mean(collect))}%`);
    statsCollect.forEach((o) => console.log(o));
  }
  return rare.length > config.minTrigger || exceptional;
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
    if (isEstimation) {
      const worthChecking = estimateRarity(statsObj, header);
      if (worthChecking) {
        console.log(`at least ${config.minTrigger + 1} items below ${
          config.threshold}% - considered worth checking under: https://cnft.io/token.php?id=${entry.id}`);
      }
    } else {
      // we have no rarity chart for the given project, simply return the entries ordered by price
      console.log(header);
      let exceptional = false;
      const collect = [];
      for (const key of Object.keys(statsObj)) {
        if ((config.extraTags || []).length > 0) {
          if (config.extraTags.includes((String(statsObj[key])).toLowerCase())) {
            exceptional = true;
          }
          collect.push(`\t${key}: ${statsObj[key]} ${exceptional ? '!!!!!' : ''}`);
        } else {
          console.log(`\t${key}: ${statsObj[key]}`);
        }
      } // end-for stats
      if (collect.length > 0) {
        collect.forEach(o => console.log(o));
      }
      console.log(`check under https://cnft.io/token.php?id=${entry.id}`);
    } // end-if no-estimation
  } // end-for assets
}
(async function () {

  try {
    rarityChart = JSON.parse(fs.readFileSync(`${__dirname}/rarities/${config.project}/rarity_chart.json`).toString());
    isEstimation = Object.keys(rarityChart).length > 0;
  } catch (err) {
    console.log(`no rarity chart found for project ${config.project} - continuing without evaluation`);
  }
  try {
    const query = `${queryPrefix}&page=1&pricemin=${config.minPrice}&pricemax=${config.maxPrice}`;

    const res = await axios.post(`https://api.cnft.io/market/listings`, query);
    const found = res.data.found;
    let pages = _.round(parseFloat(found) / 25 > config.maxPages ? config.maxPages : parseFloat(found) / 25) + 1;
    for (let page = 1; page <= pages; page++) {
      console.log(`crawling page ${page} of ${pages}`);
      await crawlData(page);
    }
  } catch (err) {
    if (err.data) {
      console.log(err.data);
    } else {
      console.error(err);
    }
  }
})();
