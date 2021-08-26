export function rankOffers(offers, influencer){
  const userDetails = influencer.userDetails;
  const categories = userDetails.influencerCategories;
  if(!categories){
    throw new Error("Can't list offers for an user without influencer categories");
  }
  const followers = userDetails.followers;
  const age = userDetails.age;
  const offersToReturn = [];
  for(let item of offers){
    const offerDetails = item.offerDetails;
    item.rank = 0;
    const influCategories = offerDetails.influencerCategories;
    if(!influCategories || influCategories.length == 0){
      console.log("No influencer categories for offer " + item.rangeKey);
    }
    if(Array.isArray(influCategories)){
      for(let cat of influCategories){
        if(categories.includes(cat)){
          item.rank+=process.env.categoryWeight*1;
        }
      }
    }
    if(!offerDetails.noOfFollowersRange || offerDetails.noOfFollowersRange.length == 0){
      console.log("Offer " + item.rangeKey + " doesn't have number of followers");
    }else{
      const noOfFollowersRange = offerDetails.noOfFollowersRange;
      if(typeof noOfFollowersRange === 'string' || noOfFollowersRange instanceof String){
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
      }
      const ageRanges = offerDetails.ageRange;
      if(!ageRanges && Array.isArray(ageRanges) && ageRanges.length != 0){
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
    offersToReturn.push(item);
    console.log(offersToReturn);
  }
  offersToReturn.sort((a,b) => (a.rank < b.rank) ? 1 : -1);
  return offersToReturn;
};
