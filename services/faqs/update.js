import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  console.log(data);
  //const convertedOfferDetails = AWS.DynamoDB.Converter.input(data.offerDetails);
  const params = {
    TableName: process.env.faqsTableName,
    Key: {
      category: data.category,
      faqId: data.faqId
    },
    UpdateExpression: "SET details = :details",
    ExpressionAttributeValues: {
      ":details": data.details
    },
    ReturnValues: "ALL_NEW"
  };
  await dynamoDb.update(params);
  return { status: true };
});
