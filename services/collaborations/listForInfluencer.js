import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
export const main = handler(async (event, context) => {
  const collabs = await dynamoDb.query({
    TableName: process.env.collaborationTableName,
    KeyConditionExpression: '#id = :id',
    FilterExpression: '#st = :status',
    ExpressionAttributeNames: {
      "#st" : "status",
      "#id" : "influencerId"
    },
    ExpressionAttributeValues: {
      ':status': "POSTED",
      ':id': event.pathParameters.id
    }
  });
  if ( ! collabs.Items) {
    throw new Error("Item not found.");
  }
  return collabs.Items;
});
