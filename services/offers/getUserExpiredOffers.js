import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

/*
  expired offers being retrieved for a business
*/
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.expiredOffersTable,
    KeyConditionExpression: 'businessId = :businessId',
    ExpressionAttributeValues: {
      ':businessId': data.businessId,
    }
  };
  const result = await dynamoDb.query(params);
  if ( ! result.Items) {
    throw new Error("Item not found.");
  }
  return result.Items;
});
