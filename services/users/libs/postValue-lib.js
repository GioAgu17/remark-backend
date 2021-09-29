const values = require('../resources/averagePostValue');

export function calculateAveragePostValue(followers, engagementRate){

    const er = parseFloat(engagementRate);

    for(let range of values.ranges){
        // Increase the mathematical ratio with a 2% of the price min for every ER point
        const percentage = (range.vmin / 100) * 2; // 2% of vmin
        const erIncrease = er * percentage;

        if(followers >= range.fmin && typeof range.fmax === 'undefined' && typeof range.vmax === 'undefined'){
            // Calculate the ratio between followers and price as single values
            return Math.round(((followers * range.vmin) / range.fmin) + erIncrease);
        }
        else if(followers >= range.fmin && followers < range.fmax){
            // Calculate the ratio between followers and price ranges
            const pricediff = range.vmax - range.vmin;
            const followersdiff = range.fmax - range.fmin;
            const followersval = followers - range.fmin;
            const priceval = ((followersval * pricediff) / followersdiff);
            return Math.round(range.vmin + priceval + erIncrease);
        }
    }
    console.log('Not enought followers');
    return 0;
}
