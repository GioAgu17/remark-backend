export function rankOffers(offers, userDetails){
  const categories = userDetails.influencerCategories;
  const followers = userDetails.followers;
  const engagement = userDetails.engagement * 1;
  const age = userDetails.age;
  for(let item of offers){
    item.rank = 0;
    const influCategories = item.offerDetails.influencerCategories;
    for(let cat of influCategories){
      if(categories.includes(cat)){
        item.rank+=process.env.categoryWeight*1;
      }
    }
    const followersRange = item.offerDetails.noOfFollowersRange.split("-");
    const minFollowers = followersRange[0] *1;
    const maxFollowers = followersRange[1] *1;
    if(followers >= minFollowers && followers<=maxFollowers){
      item.rank+=process.env.followersWeight*1;
    }else if(followers > maxFollowers){
      item.rank+=process.env.followersWeight - 1;
    }else if(followers >= (minFollowers*0.8)){
      item.rank+=process.env.followersWeight - 2;
    }else if(followers >= (minFollowers*0.7)){
      item.rank+=process.env.followersWeight - 2.5;
    }
    const erRange = item.offerDetails.engagementRateRange.split("-");
    const minEr = parseFloat(erRange[0]);
    const maxEr = parseFloat(erRange[1]);
    if(engagement >= minEr && engagement <= maxEr){
      item.rank+=process.env.engagementWeight*1;
    }else if(engagement > maxEr){
      item.rank+=process.env.engagementWeight - 1;
    }else if(engagement > (minEr*0.8)){
      item.rank+=process.env.engagementWeight - 1.5;
    }else if(engagement > (minEr*0.7)){
      item.rank+=process.env.engagementWeight - 1.75;
    }
    const ageRange = item.offerDetails.ageRange.split("-");
    const minAge = ageRange[0] *1;
    const maxAge = ageRange[1] *1;
    if(age >= minAge && age <= maxAge){
      item.rank+=process.env.ageWeight*1;
    }
  }
  offers.sort((a,b) => (a.rank < b.rank) ? 1 : -1);
  return offers;
};
