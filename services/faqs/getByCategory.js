import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  console.log("Inside getByCategory");
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.faqsTableName,
    KeyConditionExpression: 'category = :category',
    ExpressionAttributeValues: {
      ':category': data.category,
    }
  };
  const result = await dynamoDb.query(params);
  console.log(result);
  if ( ! result.Items) {
    throw new Error("Item not found.");
  }
  return result.Items;
});
