const inquirer = require('inquirer');
const _ = require('lodash');

module.exports = {
  askCrawlerSettings: (conf) => {
    const defaults = conf.getConfiguration();

    const questions = [
      {
        name: 'project',
        type: 'input',
        default: defaults.project,
        message: 'project name - as shown on CNFT.io:',
        validate: (value) => {
          if (value.length) {
            conf.set('project', value);
            return true;
          } else {
            return 'Please enter project name';
          }
        }
      },
      {
        name: 'minPrice',
        type: 'number',
        message: 'minimum price to look for:',
        default: defaults.minPrice || 8,
        validate: (value) => {
          if (_.isNumber(value) && value >= 8) {
            conf.set('minPrice', value);
            return true;
          } else {
            return 'Please enter a positive numeric value.';
          }
        }
      },
      {
        name: 'maxPrice',
        type: 'number',
        message: 'maximum price to look for:',
        default: defaults.maxPrice || 8,
        validate: (value) => {
          if (_.isNumber(value) && value >= 8) {
            conf.set('maxPrice', value);
            return true;
          } else {
            return 'Please enter a positive numeric value.';
          }
        }
      },
      {
        name: 'extraTags',
        type: 'input',
        default: defaults.extraTags,
        message: 'comma delimited list of tags to look for:',
        validate: (value) => {
          if (value.length) {
            if (value.length === 1 && value[0].trim().length === 0) {
              value = null;
              return true;
            }
            const list = Array.isArray(value) ? value : value.split(',');
            conf.set(
              'extraTags',
              list.map((o) => o.trim())
            );
            return true;
          } else {
            return 'Please enter tag content to look for';
          }
        }
      },
      {
        name: 'filter',
        type: 'list',
        choices: ['all', 'extraTags', 'rarity'],
        default: defaults.filter,
        message: 'filter results on:',
        validate: (value) => {
          if (value.length) {
            conf.set('filter', value);
            return true;
          } else {
            return 'Please choose filter';
          }
        }
      },
      {
        name: 'threshold',
        type: 'number',
        message: 'threshold in percentage to consider a trait valuable:',
        default: defaults.threshold || 4,
        validate: (value) => {
          if (_.isNumber(value) && value >= 0) {
            conf.set('threshold', value);
            return true;
          } else {
            return 'Please enter a positive numeric value.';
          }
        }
      },
      {
        name: 'minTrigger',
        type: 'number',
        message:
          'minimal amount of traits with given threshold to consider an item valuable:',
        default: defaults.minTrigger || 3,
        validate: (value) => {
          if (_.isNumber(value) && value >= 0) {
            conf.set('minTrigger', value);
            return true;
          } else {
            return 'Please enter a positive numeric value.';
          }
        }
      },
      {
        name: 'maxPages',
        type: 'number',
        message:
          'maximal amount of pages to crawl through (25 items per page):',
        default: defaults.maxPages || 15,
        validate: (value) => {
          if (_.isNumber(value) && value >= 0) {
            conf.set('maxPages', value);
            return true;
          } else {
            return 'Please enter a positive numeric value.';
          }
        }
      }
    ];
    return inquirer.prompt(questions);
  }
};
