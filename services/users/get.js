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
  // not sure where to get/store the IG username
  let fakEvt = { 'pathParameters' : {'id' : 'chiaraferragni'} };
  let statistics = await stats.userStatistics(fakEvt);
  if( typeof statistics !== 'undefined' && Object.keys(statistics).length )
    return Object.assign( result.Item, {'ig_stats' : JSON.parse(statistics.body)} );
  return result.Item;
});
