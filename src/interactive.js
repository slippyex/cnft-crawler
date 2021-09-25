const clear = require('clear');
const chalk = require('chalk');
const figlet = require('figlet');
const questionary = require('./questionary');

const Configstore = require('./utils/configStore');
const conf = new Configstore();

const crawler = require('./lib/crawler');
const CLI = require('clui');

const fs = require('fs');

let extraData = {};

const keypress = async () => {
  process.stdin.setRawMode(true);
  return new Promise((resolve) =>
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      resolve();
    })
  );
};

(async function () {
  clear();

  console.log(
    chalk.yellow(figlet.textSync('CNFT toolkit', {horizontalLayout: 'full'}))
  );
  const config = await questionary.askCrawlerSettings(conf);
  config.queryPrefix = `pricemin=${config.minPrice}&pricemax=${
    config.maxPrice
  }&sort=price&order=asc&project=${config.project.replace(
    / /g,
    '+'
  )}&verified=${!config.unverified}`;

  if (config.project === 'NiftyTeddy') {
    if (Object.keys(extraData).length === 0) {
      const tmp = fs
        .readFileSync(
          `${__dirname}/../rarities/NiftyTeddy/rarity_per_item.json`
        )
        .toString();
      extraData = JSON.parse(tmp);
    }
  }
  const progress = CLI.Progress;
  const results = await crawler(config, extraData, true, progress);
  let pc = 1;
  for (const page of results) {
    clear();
    crawler.presentData(page);
    console.log(`${pc} / ${results.length} - press key to continue`);
    pc++;
    await keypress();
  }
  process.exit(0);
})();
