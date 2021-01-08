import AWS from "aws-sdk";
export function rankOffers(offers, influencer){
  const categories = influencer.categories;
  console.log(categories);
  const followers = influencer.followers;
  console.log(followers);
  const engagement = ((influencer.avgLikes *1) / (influencer.followers *1)) * 100;
  console.log(engagement);
  const age = influencer.age;
  console.log(age);
  offers.forEach(function(item, index){
    const unmarshalledItem = AWS.DynamoDB.Converter.unmarshall(item);
    unmarshalledItem.rank = 0;
    const influCategories = unmarshalledItem.influencerCategories.values;
    console.log(influCategories);
    influCategories.forEach(function(category,index){
      if(categories.indexOf(category) > -1){
        unmarshalledItem.rank+=process.env.CATEGORY_WEIGHT;
        console.log("Inside category");
      }
    });
    const followersRange = item.noOfFollowersRange.toString();
    console.log(followersRange);
    const followerNums = followersRange.split("-");
    const minNoOfFollowers = followerNums[0];
    const maxNoOfFollowers = followerNums[1];
    if(followers >= minNoOfFollowers && followers <= maxNoOfFollowers){
      item.rank+=process.env.FOLLOWERS_WEIGHT;
      console.log("Inside followers");
    }
    const erRange = item.engagementRateRange.toString().split("-");
    const minER = erRange[0];
    const maxER = erRange[1];
    if(engagement >= minER && engagement <= maxER){
      item.rank+=process.env.ENGAGEMENT_WEIGHT;
      console.log("Inside engagement");
    }
    const ageRange = item.ageRange.toString().split("-");
    const minAge = ageRange[0];
    const maxAge = ageRange[1];
    if(age >= minAge && age <= maxAge){
      item.rank+=process.env.AGE_WEIGHT;
      console.log("Inside age");
    }
  });
//  offers.sort((a,b) => (a.rank > b.rank) ? 1 : -1);
  console.log(offers);
}
