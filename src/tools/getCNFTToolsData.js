// project name on cnft.tools
const PROJECT = 'babyalienclub';
// project name on cnft.io
const PROJECT_NAME = 'BabyAlienClub';

const API_PREFIX = `https://cnft.tools/api/${PROJECT}?sort=ASC&method=rarity`;
const axios = require('axios');
const fs = require('fs');
const DROP_IN_FOLDER = `${__dirname}/../../rarities`;
const push = (entries, mapped) => {
  for (const entry of entries) {
    mapped[entry.name] = {
      score: parseInt(entry.rarityScore),
      rank: parseInt(entry.rarityRank)
    };
  }
  if (!fs.existsSync(`${DROP_IN_FOLDER}/${PROJECT_NAME}`)) {
    fs.mkdirSync(`${DROP_IN_FOLDER}/${PROJECT_NAME}`);
  }
  fs.writeFileSync(
    `${DROP_IN_FOLDER}/${PROJECT_NAME}/rarity_ranks.json`,
    JSON.stringify(mapped, null, 2)
  );
};
(async function () {
  const mapped = {};

  const res = await axios.get(`${API_PREFIX}`);
  const maxPages = res.data.totalReturned / 50;

  push(res.data.stats, mapped);

  for (let i = 2; i < maxPages + 2; i++) {
    const resPaged = await axios.get(`${API_PREFIX}&page=${i}`);
    push(resPaged.data.stats, mapped);
    console.log(`grabbed page ${i} of ${maxPages}`);
  }

  process.exit(0);
})();
