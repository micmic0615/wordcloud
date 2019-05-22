module.exports = (words) => {
    var rawList = [];
    var nums = [6, 5, 4, 3.5];    

    nums.forEach((n) => {
        words.forEach((w, wi) => {
            let resize = n - ((wi % 5)*(0.04*n));
            rawList.push(resize + ' ' + w);
        });  
    }); 
 
    var stringList = rawList.join('\n').toUpperCase();
    var loopList = stringList.split('\n'); 

    var wordcloudReturn = []; 
    loopList.forEach((line, i) => {
        var lineArr = line.split(' ');
        var count = parseFloat(lineArr.shift()) || 0;
        var canPush = ((count >= 5 && i % 6 === 0) || (count >= 4 && i % 3 === 0) || (count < 4))
     
        if (canPush){
            wordcloudReturn.push([lineArr.join(' '), count]);
        }
    }); 
 
    console.log(loopList.length, "/", wordcloudReturn.length) 
    return wordcloudReturn
}