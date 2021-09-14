// one-time tool to extract rarity information per trait
const rawData = require('../../rarities/NiftyTeddy/niftyteddy_data.json');
const fs = require('fs');

const rarities = {
  background: {},
  species: {},
  expression: {},
  theme: {},
  character: {},
  face: {},
  head: {},
  'left-hand': {},
  'right-hand': {},
  body: {},
  rarity: {}
};
const rarityPerTeddy = {};
for (const itm of rawData.NiftyTeddy) {
  rarityPerTeddy[itm.uid] = itm.rarity;
}
fs.writeFileSync(
  __dirname + '/../rarities/NiftyTeddy/rarity_per_item.json',
  JSON.stringify(rarityPerTeddy, null, 2)
);

for (const itm of rawData.NiftyTeddy) {
  delete itm.uid;
  delete itm.imageURL;
  for (const stat of Object.keys(itm)) {
    const s =
      stat.indexOf('.') !== -1 ? stat.substr(stat.lastIndexOf('.') + 1) : stat;
    const val = itm[stat];
    if (val) {
      if (!rarities[s][val]) {
        rarities[s][val] = 1;
      } else {
        rarities[s][val] += 1;
      }
    }
  }
}

fs.writeFileSync(
  __dirname + '/../rarities/NiftyTeddy/rarity_chart.json',
  JSON.stringify(rarities, null, 2)
);
console.log(rarities);
