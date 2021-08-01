import * as stats from "./../../statistics/api.js";
import * as postValue from "./postValue-lib";
export async function getInstaStats(userDetails, userType){
  if( userDetails.accountIG ){
      const fakEvt = { 'pathParameters' : {'id' : userDetails.accountIG} };
      let statistics = await stats.userStatistics(fakEvt);
      if( typeof statistics !== 'undefined' && Object.keys(statistics).length ){
          const averagePostValueNum = postValue.calculateAveragePostValue(statistics.followers, statistics.er);
          const averagePostValue = averagePostValueNum.toString() + "€";
          userDetails = Object.assign( userDetails, {
              'followers' : statistics.followers,
              'engagementRate' : statistics.er.toString() + "%",
              'website' : userType == 'business' ? statistics.website : null,
              'averagePostValue' : userType == 'influencer' ? averagePostValue : null,
          });
      }
  }
  return userDetails;
}
