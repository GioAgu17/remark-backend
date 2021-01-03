import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const params = {
    TableName: process.env.offersTableName,
    IndexName: process.env.offerTableIndex,
    KeyConditionExpression: 'businessId = :bus_id and offerId = :off_id',
    ExpressionAttributeValues: {
      ':bus_id': event.requestContext.identity.cognitoIdentityId,
      ':off_id': event.pathParameters.id
    }
  };
  const result = await dynamoDb.query(params);
  if ( ! result.Item) {
    throw new Error("Item not found.");
  }
  // Return the retrieved item
  return result.Item;
});
