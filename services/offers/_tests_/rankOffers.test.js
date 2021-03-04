const offers = require('../mocks/offers');
const influencer = require('../mocks/influencer');
test('rank offer', () => {
  const t0 = performance.now();
  const userDetails = influencer.userDetails;
  const categories = userDetails.influencerCategories;
  const followers = userDetails.followers;
  const engagement = userDetails.engagement * 1;
  const age = userDetails.age;
  for(let item of offers){
    item.rank = 0;
    const influCategories = item.offerDetails.influencerCategories;
    for(let cat of influCategories){
      if(categories.includes(cat)){
        item.rank+=4;
      }
    }
    const followersRange = item.offerDetails.noOfFollowersRange.split("-");
    const minFollowers = followersRange[0] *1;
    const maxFollowers = followersRange[1] *1;
    if(followers >= minFollowers && followers<=maxFollowers){
      item.rank+=3;
    }else if(followers > maxFollowers){
      item.rank+=2;
    }else if(followers >= (minFollowers*0.8)){
      item.rank+=1;
    }else if(followers >= (minFollowers*0.7)){
      item.rank+=0.5;
    }
    const erRange = item.offerDetails.engagementRateRange.split("-");
    const minEr = parseFloat(erRange[0]);
    const maxEr = parseFloat(erRange[1]);
    if(engagement >= minEr && engagement <= maxEr){
      item.rank+=2;
    }else if(engagement > maxEr){
      item.rank+=1;
    }else if(engagement > (minEr*0.8)){
      item.rank+=0.5;
    }else if(engagement > (minEr*0.7)){
      item.rank+=0.25;
    }
    const ageRange = item.offerDetails.ageRange.split("-");
    const minAge = ageRange[0] *1;
    const maxAge = ageRange[1] *1;
    if(age >= minAge && age <= maxAge){
      item.rank+=1
    }
    console.log(item.rank);
  }
  offers.sort((a,b) => (a.rank < b.rank) ? 1 : -1);
  var t1 = performance.now();
  console.log("Ranking offers took " + (t1-t0) + " ms");
  for (var i = 0; i < offers.length-1; i++) {
    expect(offers[i].rank).toBeGreaterThanOrEqual(offers[i+1].rank);
  }
});
