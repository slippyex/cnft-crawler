var blessed = require('blessed')
  , contrib = require('blessed-contrib')
  , screen = blessed.screen()
  , grid = new contrib.grid({rows: 1, cols: 2, screen: screen})

var table = contrib.table(
  { keys: true
    , fg: 'white'
    , selectedFg: 'white'
    , selectedBg: 'blue'
    , interactive: true
    , label: 'Active Processes'
    , width: '60%'
    , height: '80%'
    , border: {type: "line", fg: "cyan"}
    , columnSpacing: 10 //in chars
    , columnWidth: [16, 12, 12] /*in chars*/ })

//allow control the table with the keyboard
table.focus()

table.setData(
  { headers: ['col1', 'col2', 'col3']
    , data:
      [ [1, 2, 3]
        , [4, 5, 6]
        , [4, 5, 6]        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]
        , [4, 5, 6]


      ]})

screen.append(table);
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

table.rows.on('select', (item, index) => {
    console.log(item, index);
    screen.refresh();
})

screen.render()
