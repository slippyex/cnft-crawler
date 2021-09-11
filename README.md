# CNFT crawler for rarities on sale

First iteration of this script solely works on the project "Clay Nation by Clay Mates"

### pre-requisites
In order to run the script, you have to have NodeJS installed and should be familiar
with editing a simple configuration file

### usage
simply edit the file under /config/ to fit your lookup criteria
and run it via 
`node index.js`

Have a closer look to the output and decide if you want to check and buy

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

