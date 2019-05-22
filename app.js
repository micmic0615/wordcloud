const port = 4000;
const fs = require('fs');
const listAssembler = require('./src/list-assembler.js')
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ type: 'multipart/form-data' }));
app.use(bodyParser.json({ type: 'application/json' }));

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

var WORDS = listAssembler(require('./src/wordlist.js').filter((p,i) => (i % 10 === 0)));
var LISTS; 
try {
    var dir = './db';
    if (!fs.existsSync(dir)){fs.mkdirSync(dir)}
    LISTS = JSON.parse(fs.readFileSync('db/lists.json'));
} catch(e){
    let shuffledList = [...WORDS];
    shuffleArray(shuffledList)
    LISTS = { 
        BASE: [...shuffledList],
        UPDATED: [...shuffledList],
        RENDERED: null,
        CHANGES: []
    }
    fs.writeFileSync('db/lists.json', JSON.stringify(LISTS));
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
app.get('/allchange', function(req, res){
    res.sendFile(__dirname + '/build/index.html');
});
app.get('/oneword', function(req, res){
    res.sendFile(__dirname + '/build/index.html');
});

app.post('/fetch', function (req, res) {
    res.send({
        baseList: LISTS.BASE,
        replaceList: LISTS.UPDATED,
        changes: LISTS.CHANGES,
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
    let word = req.body.word.toUpperCase();
    let ratio = req.body.ratio || req.body.ratio === 0 ? req.body.ratio : 25;

    if (word && word !== ""){
        if (LISTS.RENDERED){
            if (LISTS.CHANGES.length < LISTS.RENDERED.length){
                let rawUpdate = LISTS.UPDATED.map((item)=>item[0]);
                let rawList = LISTS.BASE.map((item)=>item[0]);
                let rawRendered = LISTS.RENDERED.map((item)=>item[0]);

                let uniqueList = [];
                rawRendered.forEach(e => {
                    if (!uniqueList.includes(e)){
                        uniqueList.push(e)
                    }
                });

                if (!rawUpdate.includes(word) && !rawList.includes(word)){
                    let matchingList = [];
                    let matchingWord = null;
                    let matchingStrictness = 0;
                    let matchRatio = Math.ceil(uniqueList.length*(ratio / 100));
                    if (matchRatio < 1){matchRatio = 1}

                    let currentMatches = 0;
                    

                    LISTS.UPDATED.forEach((p) => {if (LISTS.CHANGES.includes(p[0])){currentMatches++}})
                    let currentRatio = Math.ceil(currentMatches*100 / LISTS.UPDATED.length);

                    if (currentRatio + ratio < 100){
                        while(matchingList.length < matchRatio){
                            matchingWord = rawUpdate.find((p) => rawList.includes(p) && rawRendered.includes(p) && !matchingList.includes(p) && Math.abs(p.length - word.length) <= matchingStrictness);
                            if (!matchingWord){
                                matchingStrictness++;
                            } else {
                                matchingStrictness = 0;
                                matchingList.push(matchingWord)
                                matchingWord = null;
                            }
                        }
                    } else {
                        matchingList = rawUpdate.filter((p) => !LISTS.CHANGES.includes(p));
                    }
            
                    let stringify = LISTS.UPDATED.join('<---delimiter--->');
                    matchingList.forEach((p) => {
                        stringify = stringify.split(p).join(word)
                    })
                    

                    LISTS.UPDATED = stringify.split("<---delimiter--->").map((item)=>item.split(','));
                    LISTS.CHANGES.push(word);

                    fs.writeFileSync('db/lists.json', JSON.stringify(LISTS));
            
                    res.send({
                        baseList: LISTS.BASE,
                        replaceList: LISTS.UPDATED
                    })
                } else {
                    res.status(500).send({error: 'Word is already registered'})
                }
            } else {
                res.status(500).send({error: 'Word registry is full'})
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
    LISTS.CHANGES = [];

    fs.writeFileSync('db/lists.json', JSON.stringify(LISTS));

    res.send({
        baseList: LISTS.BASE,
        replaceList: LISTS.UPDATED
    })
})

app.listen(port,'107.10.114.154', () => console.log(`Example app listening on port ${port}!`))