import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  console.log("Inside get");
  const params = {
    TableName: process.env.faqsTableName,
    Key : {
      "category" : event.pathParameters.id,
      "faqId" : event.requestContext.faqId
    }
  };
  const result = await dynamoDb.get(params);
  if ( ! result.Items) {
    throw new Error("Item not found.");
  }
  return result.Items[0];
});
