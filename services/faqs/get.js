import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.faqsTableName,
    Key : {
      "category" : data.category,
      "faqId" : data.faqId
    }
  };
  const result = await dynamoDb.get(params);
  if ( ! result.Item) {
    throw new Error("Item not found.");
  }
  return result.Item;
});
