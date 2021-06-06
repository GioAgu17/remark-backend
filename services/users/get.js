import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";
import * as stats from "../statistics/api.js";

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
      let d = new Date();
      d.setMonth(d.getMonth() - 4);
      let dstr = d.toLocaleDateString('en-US');
      dstr = dstr.split("/");
      const yearMonth = parseInt(dstr[2] + dstr[0]);

      const recent_collabs = await dynamoDb.query({
        TableName: process.env.collaborationsTableName,
        KeyConditionExpression: '#id = :id',
        FilterExpression: '#ym > :yearMonth and #st = :status',
        ExpressionAttributeNames: {
          "#st" : "status",
          "#ym" : "yearMonth",
          "#id" : "influencerId"
        },
        ExpressionAttributeValues: {
          ':yearMonth': yearMonth,
          ':status': "COMPLETED",
          ':id': result.Item.userId
        }
      });
      result.Item.userDetails = Object.assign( result.Item.userDetails, {
          'collaborations' : recent_collabs.Count, // should be set and valorized to 0 if no results
      });

      const collabs = await dynamoDb.query({
        TableName: process.env.collaborationsTableName,
        KeyConditionExpression: '#id = :id', // we need a proper GSI id/status
        FilterExpression: '#st = :status',
        ExpressionAttributeNames: {
          "#st" : "status",
          "#id" : "influencerId"
        },
        ExpressionAttributeValues: {
          ':status': "COMPLETED",
          ':id': result.Item.userId
        }
      });
      if(collabs.Items){
          let cities = new Set();
          Object.keys(collabs.Items).forEach(function(key) {
              const collab = collabs.Items[key];
              const city = collab.details.offerDetails.address.city;
              if(city)
                cities.add(city);
          });
          cities = Array.from(cities);
          if(cities.length)
            result.Item.userDetails = Object.assign( result.Item.userDetails, {
                'citiesWithRemark' : JSON.stringify(cities)
            });
      }
  }

  let fakEvt = { 'pathParameters' : {'id' : result.Item.userDetails.accountIG} };
  let statistics = await stats.userStatistics(fakEvt);
  statistics = JSON.parse(statistics.body);
  if( typeof statistics !== 'undefined' && Object.keys(statistics).length ){
      result.Item.userDetails = Object.assign( result.Item.userDetails, {
          'followers' : statistics.followers,
          'engagementRate' : statistics.er,
          'website' : result.Item.userType == 'business' ? statistics.website : null,
      });
  }
  return result.Item;
});
