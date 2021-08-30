import handler from "./libs/handler-lib";
import * as consts from "./constants.js";
import * as collabStats from "./libs/collabStats-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as instaCollabs from "./libs/instaCollab-lib";
export const main = handler(async (event, context) => {
  const params = {
    TableName: process.env.userTableName,
    Key: {
      "userId": event.requestContext.identity.cognitoIdentityId
    }
  };
  const result = await dynamoDb.get(params);
  if(!result.Item){
    return "Item not found";
  }

  let d = new Date();
  const currentMonth = d.getMonth() + 1;
  d.setMonth(d.getMonth() - 4);
  let dstr = d.toLocaleDateString('en-US');
  dstr = dstr.split("/");
  var monthsMap = new Map();
  const yearMonth = parseInt(dstr[2] + dstr[0]);
  for(let i = 0; i < consts.MONTHS_FOR_RECENT_COLLAB; i++){
    if(currentMonth == 1){
      if(i != 0){
        monthsMap.set(12 -i + 1, 0);
      }
      else
        monthsMap.set(1, 0);
    }
    else{
      if(currentMonth - i == 0){
        monthsMap.set(12, 0);
      }
      if(currentMonth - i == -1)
        monthsMap.set(11, 0);
      else if(currentMonth - i == -2)
        monthsMap.set(10, 0);
      else if(currentMonth -i == -3)
        monthsMap.set(9, 0);
      else
        monthsMap.set(currentMonth -i, 0);
    }
  }
  const recent_collabs = await dynamoDb.query({
    TableName: process.env.collaborationsTableName,
    IndexName: process.env.collabCountIndex,
    KeyConditionExpression: '#id = :id and #ym > :yearMonth',
    FilterExpression: '#st = :status',
    ExpressionAttributeNames: {
      "#st" : "status",
      "#ym" : "yearMonth",
      "#id" : "influencerId"
    },
    ExpressionAttributeValues: {
      ':yearMonth': yearMonth,
      ':status': consts.statuses.POSTED,
      ':id': result.Item.userId
    }
  });
  if(!recent_collabs.Items){
    throw new Error("Error in returnig recent collabs");
  }
  var recentCollabs = [];
  for(let recent_collab of recent_collabs.Items){
      const yearMonth = recent_collab.yearMonth;
      const month = yearMonth.toString().substring(4, yearMonth.length);
      const previousCount = monthsMap.get(parseInt(month));
      monthsMap.set(parseInt(month), previousCount + 1);
  }
  const keys = Array.from(monthsMap.keys());
  for(let key of keys){
    recentCollabs.push({
      "month" : key,
      "count" : monthsMap.get(key)
    });
  }
  result.Item.userDetails = Object.assign( result.Item.userDetails, {
      'recentCollabs' : recentCollabs, // should be set and valorized to 0 if no results
  });

  // getting total and active collaboration
  result.Item.userDetails = await collabStats.getCollabStats(event.requestContext.identity.cognitoIdentityId, result.Item.userType, result.Item.userDetails);
  if(result.Item.userType == 'business'){

    const businesses = await dynamoDb.query({
        TableName: process.env.userTableName,
        IndexName: process.env.userTypeIndex,
        KeyConditionExpression: 'userType = :userType',
        ExpressionAttributeValues: {
            ':userType': 'business'
        }
    });
    result.Item.userDetails = Object.assign( result.Item.userDetails, {
        'remarkRanking' : businesses.Count,
    });
  }
  else if(result.Item.userType == 'influencer'){
      const collabs = await dynamoDb.query({
        TableName: process.env.collaborationsTableName,
        KeyConditionExpression: '#id = :id',
        FilterExpression: '#st = :status',
        ExpressionAttributeNames: {
          "#st" : "status",
          "#id" : "influencerId"
        },
        ExpressionAttributeValues: {
          ':status': "POSTED",
          ':id': result.Item.userId
        }
      });
      if(collabs.Items){
          let citiesWithDetails = [];
          Object.keys(collabs.Items).forEach(function(key) {
            const collab = collabs.Items[key];
            if(collab.details.offerDetails.address && collab.details.offerDetails.address.city){
              var cityWithDetails = {};
              cityWithDetails.name = collab.details.offerDetails.address.city;
              cityWithDetails.latlng = {};
              cityWithDetails.latlng.latitude = collab.details.offerDetails.latitude;
              cityWithDetails.latlng.longitude = collab.details.offerDetails.longitude;
              citiesWithDetails.push(cityWithDetails);
            }
          });
          if(citiesWithDetails)
            result.Item.userDetails = Object.assign( result.Item.userDetails, {
                'citiesWithRemark' : citiesWithDetails
            });
      }
  }
  // getting insta stats
  result.Item.userDetails = await instaCollabs.getInstaStats(result.Item.userDetails, result.Item.userType);
  return result.Item;
});

export function calculateActiveCollabsCount(collabs){
  var activeBusinessCollabs = 0;
  if(collabs.Items){
    for(let collab of collabs.Items){
      if(collab.status === consts.statuses.POSTING || collab.status === consts.statuses.INPROGRESS)
        activeBusinessCollabs++;
    }
  }
  return activeBusinessCollabs;
}
