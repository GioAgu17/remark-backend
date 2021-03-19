import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as engine from "./libs/engine-lib";
export const main = handler(async (event, context) => {
  const params = {
    TableName: process.env.offersTableName,
    IndexName: process.env.offerTableIndex,
    KeyConditionExpression: 'businessId = :bus_id',
    ExpressionAttributeValues: {
      ':bus_id': event.pathParameters.id,
    }
  };
  const result = await dynamoDb.query(params);
  if ( ! result.Items) {
    throw new Error("Item not found.");
  }
  const businessOffers =  result.Items;
  const remarkerId = event.requestContext.identity.cognitoIdentityId;
  const getParams = {
    TableName: process.env.userTableName,
    Key: {
      userId: remarkerId
    }
  };
  const remarkerResult = await dynamoDb.get(getParams);
  if ( ! remarkerResult.Item) {
    throw new Error("Remarker not found.");
  }
  const remarker = remarkerResult.Item;
  const offersRanked = await engine.rankOffers(businessOffers, remarker);
  return offersRanked;
});
