import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  if(!data.rangeKey){
    throw new Error("Cannot proceed without rangeKey");
  }
  if(!data.expiryDate){
    throw new Error("Cannot proceed without expiryDate");
  }
  const readParams = {
    TableName: process.env.offersTableName,
    Key: {
      "hashKey": process.env.partitionKeyOffer,
      "rangeKey": data.rangeKey
    }
  };
  const result = await dynamoDb.get(readParams);
  if(!result.Item){
    return "Item not found";
  }
  var offerDetails = result.Item.offerDetails;
  offerDetails.expiryDate = data.expiryDate;
  offerDetails.applications.clear();
  const updateParams = {
    TableName: process.env.offersTableName,
    Key: {
      "hashKey": process.env.partitionKeyOffer,
      "rangeKey": data.rangeKey
    },
    UpdateExpression: "SET offerDetails = :offerDetails",
    ExpressionAttributeValues: {
      ":offerDetails": offerDetails
    },
    ReturnValues: "ALL_NEW"
  };
  await dynamoDb.update(updateParams);
  return { status: true };
});
