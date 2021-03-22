import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const params = {
    TableName: process.env.faqsTableName
  };
  const result = await dynamoDb.scan(params);
  if ( ! result.Items) {
    throw new Error("Item not found.");
  }
  return result.Items;
});
