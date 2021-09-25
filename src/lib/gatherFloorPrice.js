const axios = require('axios');
const dayjs = require('dayjs');
const fs = require('fs');
const _ = require('lodash');
const chalk = require('chalk');
const figlet = require('figlet');
const clear = require('clear');

const statsFile = __dirname + '/../../dist/floor-stats.json';
/**
 * functionality to grab current floor price in ADA for a given
 * project on cnft.io
 *
 * @param config
 * @param extraData
 * @returns {Promise<void>}
 */
module.exports = async (config, extraData) => {
  console.log(
    `entering cnft crawler with floor check on project ${config.project}`
  );

  const query = `page=1&sort=price&order=asc&project=${config.project.replace(
    / /g,
    '+'
  )}&verified=true`;
  try {
    const resFloor = await axios.post(
      `https://api.cnft.io/market/listings`,
      query
    );

    const assets = _.get(resFloor, 'data.assets', []);

    if (assets.length > 1) {
      const firstItem = assets[0];
      const maxLength = Math.min(assets.length, 25);
      const groupedByPrice = _.groupBy(assets.slice(0, maxLength), 'price');
      const meanFloor = _.round(
        _.mean(Object.keys(groupedByPrice).map((o) => parseInt(o) / 1000000))
      );
      const price = firstItem.price / 1000000;
      clear();
      console.log(
        chalk.yellow(
          figlet.textSync('CNFT toolkit', {horizontalLayout: 'full'})
        )
      );
      console.log(
        chalk`\nCurrent floor for project ${config.project} is {red {bold {underline ${price}}}} ADA`
      );
      console.log(
        chalk`\nBased on the first ${maxLength} items, the mean floor is at {yellow {bold {underline ${meanFloor}}}} ADA`
      );
      console.log(`\nin detail these are:`);
      console.log(`=====================================`);
      for (const entry of Object.keys(groupedByPrice)) {
        const p = parseInt(entry) / 1000000;
        const amount = groupedByPrice[entry].length;
        console.log(`${amount} item${amount > 1 ? 's' : ''} at\tADA ${p}`);
      }
      console.log(`=====================================`);
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
          const diff = price - previousEntry.price;
          const wrappedDiff = diff < 0 ? `${diff}` : `+${diff}`;
          console.log(
            `floor changed from last check on ${previousEntry.timestamp} to ${wrappedDiff} ADA`
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
};
