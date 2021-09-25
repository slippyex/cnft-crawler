const axios = require('axios');
require('dotenv').config({path: '../.env'});
const fs = require('fs');
const _ = require('lodash');

const TOKEN_LOCATION = `${__dirname}/../auth-token`;
let token = '';

const reAuthenticate = async () => {
  try {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;
    const results = await axios.post('https://api.cnft.io/auth/login', {
      email,
      password
    });
    return results.data.token;
  } catch (err) {
    if (err.isAxiosError) {
      console.error(err.response.data);
    } else {
      console.error(err);
    }
  }
};

const refreshItems = async () => {
  const listedItems = await axios.post(
    `https://api.cnft.io/user/listings`,
    `token=${token}&page=1&count=150`
  );
  for (const entry of listedItems.data) {
    const price = entry.price / 1000000;
    const randomPercent = _.round((price / 100) * _.random(1, 5));
    const newPriceVariant =
      Math.random() < 0.5 ? -randomPercent : randomPercent;
    // cap it to at least 8 ADA (minimum price to set on listing)
    const calculatedPrice = Math.max(price + newPriceVariant, 8);
    console.log(
      `listed ${entry.metadata.name} for ${price} ADA - new price ${calculatedPrice}`
    );
  }
}
(async function () {
  try {
    try {
      token = fs.readFileSync(TOKEN_LOCATION).toString();
    } catch (err) {
      token = await reAuthenticate();
      fs.writeFileSync(TOKEN_LOCATION, token);
    }
    try {
      await refreshItems();
    } catch (err) {
      token = await reAuthenticate();
      fs.writeFileSync(TOKEN_LOCATION, token);
      await refreshItems();
    }
    process.exit(0);
  } catch (err) {
    console.error(
      `unable to login to cnft.io - check provided username and password - aborting`
    );
  }
})();
