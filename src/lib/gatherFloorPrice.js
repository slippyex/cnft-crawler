const axios = require('axios');
const dayjs = require('dayjs');
const fs = require('fs');
const _ = require('lodash');
const helpers = require('../utils/helpers');

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
    const firstItem = _.get(resFloor, 'data.assets[0]', {});
    if (Object.keys(firstItem).length > 0) {
      const processedItem = helpers.transformEntry(
        config.project,
        firstItem,
        extraData
      );
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
          const diff = price - previousEntry.price;
          console.log(
            `floor changed from last check on ${previousEntry.timestamp} to ${
              diff > 0 ? '+' : ''
            }${diff} ADA`
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
