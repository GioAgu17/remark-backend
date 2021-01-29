import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const paramsToDelete = {
    TableName: process.env.faqsTableName,
    Key: {
      "category" : data.category,
      "faqId": event.pathParameters.id
    }
  };
  await dynamoDb.delete(paramsToDelete);
  return { status: true };
});
