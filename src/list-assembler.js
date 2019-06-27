module.exports = (words) => {
    var rawList = [];
    var nums = [];
    var max = 5.5;
    while(max >= 3.8){
        nums.push(max)
        max -= 0.1
    }

    nums.forEach((n) => {
        words.forEach((w, wi) => { 
            rawList.push(n + ' ' + w);
        });  
    }); 

    var stringList = rawList.join('\n').toUpperCase();
    var loopList = stringList.split('\n'); 

    var wordcloudReturn = []; 
    loopList.forEach((line, i) => {
        var lineArr = line.split(' ');
        var count = parseFloat(lineArr.shift()) || 0;
        var canPush = ((count >= 5 && i % 9 === 0) || (count >= 4 && i % 3 === 0) || (count < 4))
        wordcloudReturn.push([lineArr.join(' '), count]);
    });

    
    return wordcloudReturn
}