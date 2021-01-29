import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  //const convertedOfferDetails = AWS.DynamoDB.Converter.input(data.offerDetails);
  const params = {
    TableName: process.env.faqsTableName,
    Key: {
      category: data.category,
      faqId: data.faqId
    },
    UpdateExpression: "SET body = :body",
    ExpressionAttributeValues: {
      ":body": data.body
    },
    ReturnValues: "ALL_NEW"
  };
  await dynamoDb.update(params);
  return { status: true };
});
