export function rankOffers(offers, influencer){
  const userDetails = influencer.userDetails;
  const categories = userDetails.influencerCategories;
  const followers = userDetails.followers;
  const age = userDetails.age;
  const influencerId = influencer.userId;
  for(let item of offers){
    const offerDetails = item.offerDetails;
    const applications = offerDetails.applications;
    if(applications){
      const selected = applications.selected;
      if(Array.isArray(selected) && !selected.length){
        const selectedIds = selected.map(x => x.remarkerId);
        if(selectedIds.includes(influencerId)){
          console.log("Skipping offer "+item.offerId+" because influencerId "+ influencerId + " is among selected");
          break;
        }
      }
    }
    item.rank = 0;
    const influCategories = offerDetails.influencerCategories;
    for(let cat of influCategories){
      if(categories.includes(cat)){
        item.rank+=process.env.categoryWeight*1;
      }
    }
    const followersRange = offerDetails.noOfFollowersRange.split("-");
    const minFollowers = followersRange[0] *1;
    var maxFollowers = 0;
    if(followersRange[1] == "inf"){
      maxFollowers = Number.MAX_SAFE_INTEGER;
    }else {
      maxFollowers = followersRange[1] *1;
    }
    if(followers >= minFollowers && followers<=maxFollowers){
      item.rank+=process.env.followersWeight*1;
    }else if(followers > maxFollowers){
      item.rank+=process.env.followersWeight - 1;
    }else if(followers >= (minFollowers*0.8)){
      item.rank+=process.env.followersWeight - 2;
    }else if(followers >= (minFollowers*0.7)){
      item.rank+=process.env.followersWeight - 2.5;
    }
    const ageRanges = offerDetails.ageRanges;
    if(Array.isArray(ageRanges) && !ageRanges.length){
      for(let ageRange of ageRanges){
        ageRange = ageRange.split("-");
        const minAge = ageRange[0] *1;
        const maxAge = ageRange[1] *1;
        if(age >= minAge && age <= maxAge){
          item.rank+=process.env.ageWeight*1;
        }
      }
    }
  }
  offers.sort((a,b) => (a.rank < b.rank) ? 1 : -1);
  return offers;
};
