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

var words_negative = require('./src/list-negative.js');
var words_positive = require('./src/list-positive.js');

var WORDS_1 = listAssembler(words_negative);
var WORDS_2 = listAssembler(words_positive);


var DELAY = {timer: 0, interval: 250, value: 10000};
var LISTS; 
try {
    var dir = './db';
    if (!fs.existsSync(dir)){fs.mkdirSync(dir)}
    LISTS = JSON.parse(fs.readFileSync('db/lists.json'));
} catch(e){
    let shuffledList_1 = [...WORDS_1];
    shuffleArray(shuffledList_1);
    let shuffledList_2 = [...WORDS_2];
    shuffleArray(shuffledList_2)

    LISTS = { 
        BASE: [...shuffledList_1],
        REPLACE: [...shuffledList_2],
        UPDATED: [...shuffledList_1],
        RENDERED: null,
        CHANGES: [],
        QUEUE: [],
    }
    fs.writeFileSync('db/lists.json', JSON.stringify(LISTS));
}

app.use(express.static('build'));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/form', function(req, res){
    res.sendFile(__dirname + '/build/index.html');
});
app.get('/allchange', function(req, res){
    res.sendFile(__dirname + '/build/index.html');
});
app.get('/oneword', function(req, res){
    res.sendFile(__dirname + '/build/index.html');
});

const crunchQueue = () => {
    if (DELAY.timer > 0){
        DELAY.timer -= DELAY.interval 
    } else {
        if (LISTS.QUEUE.length){
            let {word, ratio } = LISTS.QUEUE[0]; 
            let did_run = false;

            if (word && word !== "" && LISTS.RENDERED && LISTS.CHANGES.length < LISTS.RENDERED.length){
                did_run = true;
                let rawUpdate = LISTS.REPLACE.map((item)=>item[0]);
                shuffleArray(rawUpdate);
                let rawList = LISTS.REPLACE.map((item)=>item[0]);
                let rawRendered = LISTS.REPLACE.map((item)=>item[0]);
          
                let uniqueList = [];
                rawRendered.forEach(e => {if (!uniqueList.includes(e)){uniqueList.push(e)}}); 

                let matchingList = [];
                let matchingWord = null;
                let matchingStrictness = 0;
                let matchingLimit = 0;
                let matchQuota = Math.ceil(uniqueList.length*(ratio / 100));
                if (matchQuota < 1){matchQuota = 1}

                rawUpdate.forEach((p) => {if (p.length > matchingLimit){matchingLimit = p.length}})

                while(matchingList.length < matchQuota && matchingStrictness < matchingLimit){
                    matchingWord = rawUpdate.find((p) => rawList.includes(p) && !matchingList.includes(p) && Math.abs(p.length - word.length) <= matchingStrictness);

                    if (!matchingWord){
                        matchingStrictness++;
                    } else {
                        matchingStrictness = 0;
                        matchingList.push(matchingWord)
                        matchingWord = null;
                    } 
                }

                LISTS.UPDATED = LISTS.REPLACE.map((p) => {
                    let item = [...p]
                    if (matchingList.includes(item[0])){item[0] = word}
                    return item;
                })
                
                LISTS.CHANGES = [];
                LISTS.CHANGES.push(word);

                fs.writeFileSync('db/lists.json', JSON.stringify(LISTS));
            } 

            if (did_run){
                LISTS.QUEUE.shift();
                DELAY.timer = DELAY.value; 
            } else {
                DELAY.timer = DELAY.interval;
            }
           
        } 
    }

    setTimeout(crunchQueue, DELAY.interval)
}

crunchQueue();

app.post('/fetch', function (req, res) {
    res.send({
        baseList: LISTS.BASE,
        alterList: LISTS.REPLACE,
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
        alterList: LISTS.REPLACE,
        replaceList: LISTS.UPDATED,
        changes: LISTS.CHANGES,
    })
})

app.post('/update', function (req, res) { 
    let word = req.body.word.toUpperCase();
    let ratio = req.body.ratio || req.body.ratio === 0 ? req.body.ratio : 25;

    LISTS.QUEUE.push({word, ratio});

    res.send({
        baseList: LISTS.BASE,
        alterList: LISTS.REPLACE,
        replaceList: LISTS.UPDATED,
        changes: LISTS.CHANGES,
    })
});


app.post('/reset', function (req, res) {
    let shuffledList_1 = [...WORDS_1];
    shuffleArray(shuffledList_1)

    let shuffledList_2 = [...WORDS_2];
    shuffleArray(shuffledList_2)

    LISTS = { 
        BASE: [...shuffledList_1],
        REPLACE: [...shuffledList_2],
        UPDATED: [...shuffledList_1],
        RENDERED: null,
        CHANGES: [],
        QUEUE: [] 
    }

    fs.writeFileSync('db/lists.json', JSON.stringify(LISTS));

    res.send({
        baseList: LISTS.BASE,
        alterList: LISTS.REPLACE,
        replaceList: LISTS.UPDATED,
        changes: LISTS.CHANGES,
    })
})
// mac 107.10.114.154
// windows 192.168.137.1
app.listen(port,'107.10.114.154', () => console.log(`Example app listening on port ${port}!`))