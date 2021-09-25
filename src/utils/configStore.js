const fs = require('fs');
const location = `${__dirname}/../../config.json`;

module.exports = class ConfigStore {
  constructor() {
    if (fs.existsSync(location)) {
      this.config = JSON.parse(fs.readFileSync(location).toString());
    } else {
      this.config = {};
      this.__persistConfig();
    }
  }

  set = (name, value) => {
    this.config[name] = value;
    this.__persistConfig();
  };

  getConfiguration = () => this.config;

  __persistConfig = () => {
    fs.writeFileSync(location, JSON.stringify(this.config, null, 2));
  };
};
