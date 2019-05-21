const port = 4000;
const fs = require('fs');
const listAssembler = require('./src/list-assembler.js')
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ type: 'multipart/form-data' }));
app.use(bodyParser.json({ type: 'application/json' }));


var WORDS = listAssembler(require('./src/wordlist.js').filter((p,i) => (i % 3 === 0)));
var LISTS;
try {
    var dir = './db';
    if (!fs.existsSync(dir)){fs.mkdirSync(dir)}
    LISTS = JSON.parse(fs.readFileSync('db/lists.json'));
} catch(e){
    LISTS = {
        BASE: [...WORDS],
        UPDATED: [...WORDS],
        RENDERED: null
    }
}

app.use(express.static('build'));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// This may be what you are looking for:

app.get('/form', function(req, res){
    res.sendFile(__dirname + '/build/index.html');
});

app.post('/fetch', function (req, res) {
    res.send({
        baseList: LISTS.BASE,
        replaceList: LISTS.UPDATED,
        initialize: Boolean(LISTS.RENDERED)
    })
})

app.post('/check-render', function (req, res) {
    if (!LISTS.RENDERED){
        LISTS.RENDERED = req.body.renderedWords
    };

    fs.writeFileSync('db/lists.json', JSON.stringify(LISTS));

    res.send({
        baseList: LISTS.BASE,
        replaceList: LISTS.UPDATED
    })
})

app.post('/update', function (req, res) {
    let { word } = req.body;

    if (word && word !== ""){
        if (LISTS.RENDERED){
            let rawUpdate = LISTS.UPDATED.map((item)=>item[0]);
            let rawList = LISTS.BASE.map((item)=>item[0]);
            let rawRendered = LISTS.RENDERED.map((item)=>item[0]);

            if (!rawUpdate.includes(word) && !rawList.includes(word)){
                let matchingWord = null;
                let matchingStrictness = 0;
                while(!matchingWord){
                    matchingWord = rawUpdate.find((p) => rawList.includes(p) && rawRendered.includes(p) && Math.abs(p.length - word.length) <= matchingStrictness);
                    if (!matchingWord){matchingStrictness++}
                }
        
                let stringify = LISTS.UPDATED.join('<---delimiter--->').replace(matchingWord, word);
                LISTS.UPDATED = stringify.split("<---delimiter--->").map((item)=>item.split(','));

                fs.writeFileSync('db/lists.json', JSON.stringify(LISTS));
        
                res.send({
                    baseList: LISTS.BASE,
                    replaceList: LISTS.UPDATED
                })
            } else {
                res.status(500).send({error: 'Word is already registered'})
            }
        } else {
            res.status(500).send({error: 'Not yet initialized'})
        }
    } else {
        res.status(500).send({error: 'Word is empty'})
    }
})

app.post('/reset', function (req, res) {
    LISTS.RENDERED = null;
    LISTS.UPDATED = [...WORDS];

    fs.writeFileSync('db/lists.json', JSON.stringify(LISTS));

    res.send({
        baseList: LISTS.BASE,
        replaceList: LISTS.UPDATED
    })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))