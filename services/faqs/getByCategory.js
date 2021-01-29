import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const params = {
    TableName: process.env.faqsTableName,
    Key : {
      "category" : event.pathParameters.id
    }
  };
  const result = await dynamoDb.get(params);
  if ( ! result.Items) {
    throw new Error("Item not found.");
  }
  return result.Items;
});
