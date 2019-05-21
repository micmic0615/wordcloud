module.exports = (words) => {
    var rawList = [];
    var nums = [4];

    nums.forEach((n) => {
        words.forEach((w, wi) => {
            let resize = n - ((wi % 6)*0.2) 
            rawList.push(resize + ' ' + w);
        }); 
    }); 

    var stringList = rawList.join('\n');
    var loopList = stringList.split('\n');

    var wordcloudReturn = []; 
    loopList.forEach((line, i) => {
        var lineArr = line.split(' ');
        var count = parseFloat(lineArr.shift()) || 0;
        wordcloudReturn.push([lineArr.join(' '), count]);
    });

    return wordcloudReturn
}