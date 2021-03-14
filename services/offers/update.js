import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  //const convertedOfferDetails = AWS.DynamoDB.Converter.input(data.offerDetails);
  const params = {
    TableName: process.env.offersTableName,
    Key: {
      hashKey: process.env.partitionKeyOffer,
      rangeKey: data.rangeKey
    },
    UpdateExpression: "SET offerDetails = :offerDetails",
    ExpressionAttributeValues: {
      ":offerDetails": data.offerDetails
    },
    ReturnValues: "ALL_NEW"
  };
  await dynamoDb.update(params);
  return { status: true };
});
