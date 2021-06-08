import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
export const main = handler(async (event, context) => {
  const params = {
    TableName: process.env.collaborationTableName,
    KeyConditionExpression: 'influencerId = :influencerId',
    ExpressionAttributeValues: {
      ':influencerId': event.pathParameters.id,
    }
  };
  const result = await dynamoDb.query(params);
  if ( ! result.Items) {
    throw new Error("Item not found.");
  }
  return result.Items;
});
