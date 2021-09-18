# CNFT crawler and price floor checker for rarities on sale

Gathers information about currently offered NFTs and tries to evaluate them against the provided
rarity chart (de-duplicated version).

### pre-requisites
In order to run the script, you have to have NodeJS installed and should be familiar
with editing a simple configuration file

### prior to first run
* clone the project from github (`git clone https://github.com/slippyex/cnft-crawler.git`)
* `cd cnft-crawler/`
* `npm install`

### usage
simply edit the file under /config/ to fit your lookup criteria
and run it via 
`❯ node src/index.js`

Additionally, you can override any parameter in the config file by using it as an argument

```text
❯ node src/index.js --project="Cardano Caricatures" --extraTags="epic" "rare" --minPrice=20 --maxPrice=120 --filter="extraTags"

❯ node src/index.js crawl --minPrice=600 --maxPrice=1800 --project="Cardano Waifus" --extraTags="SS" --filter="extraTags"
```


for instance would look for the given project and checks for trait tags epic and rare and flags them

You can also check for the floor of a given project by calling it via
`❯ node src/index.js --project="Spacebudz" --floor`

which would give an output similar to this
```text
❯ node src/index.js floor --project="Spacebudz" 
entering cnft crawler with floor check on project Spacebudz
Current floor for project Spacebudz is 3550 ADA
```

Have a closer look to the output and decide if you want to check and buy

```text
❯ node src/index.js --help
```
provides an overview of all possible combinations and options, you can use

### example configuration
```javascript
module.exports = {
// project to crawl (as shown on cnft.io projects list)
//  project: 'Clay Nation by Clay Mates',
project: 'Bitlands',
// threshold of trait in percent
// if 5 that means, that the trait has to have a minimum of 5% in order to be considered
threshold: 5,
// minimum amount of traits with the above threshold in order to be considered valuable
// if 3 that means, we have to have at least 3 traits with a minimum of 5% in rarity
minTrigger: 5,
// if any of the given extra tags is found in the traits, we consider the item
// valuable, regardless of the percent coverage above
//extraTags: ['blue clay', 'green clay', 'laser eyes', 'duck', 'angel wings', 'orangutan'],
extraTags: ['rare'],
// filters results just based on the given rarity criteria
filter: 'rarity',  
// minimum price in ADA
minPrice: 1000,
// maximum price in ADA
maxPrice: 1200,
// maximum amount of pages to crawl - each page has an output of 25 items
maxPages: 15
}
```

### example output
```text
Clay Nation #47XX - price 125 ADA >> overall rarity ->> 10%
        body: White Clay (31.21%) 
        eyes: Crying eye (4.83%) ***
        brows: Pierced Eyebrows (13.33%) 
        mouth: Fly Tounge (3.7%) ***
        clothes: Peace Logo Shirt (4.87%) ***
        background: Peach (14.44%) 
        accessories: Parrot (3.91%) ***
        hats and hair: Beanie (3.34%) ***
        hats and hair: Beanie (3.34%) ***
at least 4 items below 5% - considered worth checking under: https://cnft.io/token.php?id=xxxx3b8b66xxxxxxxxx
Clay Nation #02XX - price 200 ADA >> overall rarity ->> 10%
        body: White Clay (31.21%) 
        eyes: Angry Eyes (4.29%) ***
        brows: Pierced Eyebrows (13.33%) 
        mouth: Screaming (1.31%) ***
        clothes: Pink Fluffy Jacket (3.56%) ***
        background: Serenity (14.23%) 
        accessories: Gold Chain (7.9%) 
        hats and hair: Spikey Black Hair (4.01%) ***
at least 4 items below 5% - considered worth checking under: https://cnft.io/token.php?id=xxxxx22da1xxxxxxxxxx

```

