import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
export const main = handler(async (event, context) => {
  const params = {
    TableName: process.env.collaborationTableName,
    IndexName: process.env.collaborationTableIndex,
    KeyConditionExpression: 'businessId = :businessId',
    ExpressionAttributeValues: {
      ':businessId': event.pathParameters.id
    }
  };
  const result = await dynamoDb.query(params);
  console.log(result);
  if ( ! result.Items) {
    throw new Error("Item not found.");
  }
  return result.Items;
});
