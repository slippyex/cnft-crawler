const axios = require('axios');
const fs = require('fs');
const _ = require('lodash');
const defaultConfig = require('./config');
const commandLineArgs = require('command-line-args');
const dayjs = require('dayjs');

let queryPrefix = '';
let rarityChart = {};
let isEstimation = false;

const estimateRarity = (stats, name, config) => {
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
    const percentage = val / 100;
    if (percentage <= config.threshold) {
      rare.push({stat, itemValue});
    }
    statsCollect.push(
      `\t${stat}: ${itemValue} (${percentage}%) ${
        percentage <= config.threshold ? '***' : ''
      } ${config.extraTags.includes(itemValue.toLowerCase()) ? '!!!!!!' : ''}`
    );
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
};

const crawlData = async (page, config) => {
  const query = `${queryPrefix}&page=${page}`;

  const res = await axios.post(`https://api.cnft.io/market/listings`, query);
  for (const entry of res.data.assets) {
    const header = `${entry.metadata.name} - price ${
      entry.price / 1000000
    } ADA`;
    const statsObj = {};
    for (const stat of entry.metadata.tags) {
      const name = Object.keys(stat)[0];
      statsObj[name] = stat[name];
    }
    if (isEstimation) {
      const worthChecking = estimateRarity(statsObj, header, config);
      if (worthChecking) {
        console.log(
          `at least ${config.minTrigger + 1} items below ${
            config.threshold
          }% - considered worth checking under: https://cnft.io/token.php?id=${
            entry.id
          }`
        );
      }
    } else {
      // we have no rarity chart for the given project, simply return the entries ordered by price
      console.log(header);
      let exceptional = false;
      const collect = [];
      for (const key of Object.keys(statsObj)) {
        if ((config.extraTags || []).length > 0) {
          if (config.extraTags.includes(String(statsObj[key]).toLowerCase())) {
            exceptional = true;
          }
          collect.push(
            `\t${key}: ${
              _.isObject(statsObj[key])
                ? JSON.stringify(statsObj[key], null, 2)
                : statsObj[key]
            } ${exceptional ? '!!!!!' : ''}`
          );
        } else {
          console.log(`\t${key}: ${statsObj[key]}`);
        }
      } // end-for stats
      if (collect.length > 0) {
        collect.forEach((o) => console.log(o));
      }
      console.log(`check under https://cnft.io/token.php?id=${entry.id}`);
    } // end-if no-estimation
  } // end-for assets
};
(async function () {
  const optionDefinitions = [
    {name: 'project', type: String},
    {name: 'floor', alias: 'f', type: Boolean},
    {name: 'minPrice', type: Number},
    {name: 'maxPrice', type: Number},
    {name: 'threshold', type: Number},
    {name: 'minTrigger', type: Number},
    {name: 'maxPages', type: Number},
    {name: 'extraTags', type: String, multiple: true}
  ];

  const parsedOptions = commandLineArgs(optionDefinitions);
  const config = {...defaultConfig, ...parsedOptions};

  queryPrefix = `pricemin=${config.minPrice}&pricemax=${
    config.maxPrice
  }&sort=price&order=asc&project=${config.project.replace(
    / /g,
    '+'
  )}&verified=true`;

  // either check the floor price of a project or crawl the same
  if (config.floor) {
    console.log(
      `entering cnft crawler with floor check on project ${config.project}`
    );

    queryPrefix = `page=1&sort=price&order=asc&project=${config.project.replace(
      / /g,
      '+'
    )}&verified=true`;
    try {
      const statsFile = __dirname + '/dist/floor-stats.json';
      const resFloor = await axios.post(
        `https://api.cnft.io/market/listings`,
        queryPrefix
      );
      const firstItem = _.get(resFloor, 'data.assets[0]', {});
      if (Object.keys(firstItem).length > 0) {
        const price = firstItem.price / 1000000;
        console.log(
          `Current floor for project ${config.project} is ${price} ADA`
        );
        if (!fs.existsSync(statsFile)) {
          fs.writeFileSync(statsFile, '{}');
        }
        const floorStats = JSON.parse(fs.readFileSync(statsFile).toString());
        if (!floorStats[config.project]) {
          floorStats[config.project] = [];
        }
        const floorEntries = floorStats[config.project];
        if (floorEntries.length > 0) {
          const previousEntry = floorEntries[0];
          if (previousEntry.price !== price) {
            floorEntries.unshift({price, timestamp: dayjs().format()});
            console.log(
              `floor changed from last check on ${previousEntry.timestamp} to ${
                price - previousEntry.price
              } ADA`
            );
          }
        } else {
          floorEntries.push({price, timestamp: dayjs().format()});
        }
        fs.writeFileSync(statsFile, JSON.stringify(floorStats, null, 2));
      } else {
        console.log(`No entries found for given project ${config.project}`);
      }
    } catch (err) {
      console.error(err);
    }
    process.exit(0);
  }

  console.log(
    `entering cnft crawler with config: \n${JSON.stringify(config, null, 2)}`
  );

  try {
    rarityChart = JSON.parse(
      fs
        .readFileSync(
          `${__dirname}/rarities/${config.project}/rarity_chart.json`
        )
        .toString()
    );
    isEstimation = Object.keys(rarityChart).length > 0;
  } catch (err) {
    console.log(
      `no rarity chart found for project ${config.project} - continuing without evaluation`
    );
  }
  try {
    const query = `${queryPrefix}&page=1`;

    const res = await axios.post(`https://api.cnft.io/market/listings`, query);
    const found = res.data.found;
    let pages =
      _.round(
        parseFloat(found) / 25 > config.maxPages
          ? config.maxPages
          : parseFloat(found) / 25
      ) + 1;
    for (let page = 1; page <= pages; page++) {
      console.log(`crawling page ${page} of ${pages}`);
      await crawlData(page, config);
    }
  } catch (err) {
    if (err.data) {
      console.log(err.data);
    } else {
      console.error(err);
    }
  }
})();
