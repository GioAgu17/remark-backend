import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

/*
  listing all the offers for a particular business
*/
export const main = handler(async (event, context) => {
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUp - Lambda is warm!');
    return 'Lambda is warm!';
  }
  const params = {
    TableName: process.env.offersTableName,
    IndexName: process.env.offerTableIndex,
    KeyConditionExpression: 'businessId = :bus_id',
    ExpressionAttributeValues: {
      ':bus_id': event.requestContext.identity.cognitoIdentityId,
    }
  };
  const result = await dynamoDb.query(params);
  if ( ! result.Items) {
    throw new Error("Item not found.");
  }
  return result.Items;
});
