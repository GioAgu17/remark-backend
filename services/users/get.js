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
