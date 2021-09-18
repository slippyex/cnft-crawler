const defaultConfig = require('../config');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

module.exports = () => {
  const optionDefinitions = [
    {
      name: 'project',
      alias: 'p',
      type: String,
      description: 'The project name as listed on cnft.io'
    },
    {
      name: 'unverified',
      alias: 'u',
      type: Boolean,
      description: 'toggle for cnft-verified projects'
    },
    {
      name: 'fakes',
      type: Boolean,
      description: 'toggle to list and mark fakes (invalid policy id)'
    },
    {
      name: 'policy',
      type: String,
      description: 'if checking for unverified projects, you can pass in a policy id'
    },
    {
      name: 'floor',
      alias: 'f',
      type: Boolean,
      description: 'instead of crawling, just determine the floor price'
    },
    {
      name: 'floorFilter',
      type: String,
      description:
        'when determining a floor price, you can look for a certain value in traits'
    },
    {name: 'minPrice', type: Number, description: 'minimal price to look for'},
    {name: 'maxPrice', type: Number, description: 'maximal price to look for'},
    {
      name: 'threshold',
      alias: 't',
      type: Number,
      description: 'threshold in percentage to consider a trait valuable'
    },
    {
      name: 'minTrigger',
      type: Number,
      description:
        'minimal amount of traits with given threshold to consider an item valuable'
    },
    {
      name: 'maxPages',
      type: Number,
      description:
        'maximal amount of pages to crawl through (25 items per page)'
    },
    {
      name: 'extraTags',
      type: String,
      multiple: true,
      description: 'list of extra tags to look for'
    },
    {
      name: 'filter',
      type: String,
      description:
        'choose to filter results on given "extraTags", "rarity", "all"'
    },
    {name: 'help', alias: 'h', type: Boolean, description: 'This help text'}
  ];

  const parsedOptions = commandLineArgs(optionDefinitions);
  if (parsedOptions.help) {
    const sections = [
      {
        header: 'CNFT crawler and floor determination tool',
        content:
          'A tool which crawls cnft.io for cheap and/or rare items. You can also easily determine the floor of a given project'
      },
      {
        header: 'Options',
        optionList: optionDefinitions,
        tableOptions: {
          columns: [
            {
              name: 'option',
              noWrap: true,
              padding: {left: '🔥  ', right: ''},
              width: 30
            },
            {
              name: 'description',
              width: 80,
              padding: {left: '', right: '   🔥'}
            }
          ]
        }
      },
      {
        header: 'Synopsis',
        content: [
          '$ example [{bold --minPrice=120}] {bold --extraTags="legendary"} {bold --project="NiftyTeddy"}',
          '$ example {bold --help}'
        ]
      }
    ];
    const usage = commandLineUsage(sections);
    console.log(usage);
    process.exit(0);
  }
  const config = {...defaultConfig, ...parsedOptions};
  if (
    config.filter &&
    !['extraTags', 'rarity', 'all'].includes(config.filter)
  ) {
    console.log(`--filter can just be one of "extraTags", "traits" or "all"`);
    process.exit(-1);
  }
  config.queryPrefix = `pricemin=${config.minPrice}&pricemax=${
    config.maxPrice
  }&sort=price&order=asc&project=${config.project.replace(
    / /g,
    '+'
  )}&verified=${!config.unverified}`;
  return config;
};
