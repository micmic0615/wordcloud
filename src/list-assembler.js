module.exports = (words) => {
    var rawList = [];
    var nums = [];
    var fontMaxSize = 7;


    var decrement = 0.1 * (words.length/3.5)

    while(fontMaxSize >= 4.5){
        nums.push(fontMaxSize)
        fontMaxSize -= decrement
    }

    nums.forEach((n) => {
        words.forEach((w, wi) => { 
            rawList.push(n + ' ' + w);
        });  
    }); 

    console.log(nums.length * words.length)

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