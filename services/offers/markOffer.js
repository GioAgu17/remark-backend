import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const request = JSON.parse(event.body);
  const rangeKey = request.rangeKey;
  const remarkerId = request.remarkerId;
  console.log(process.env.partitionKeyOffer);
  const params = {
    TableName: process.env.offersTableName,
    Key: {
      "hashKey" : process.env.partitionKeyOffer,
      "rangeKey": rangeKey
    }
  };
  const result = await dynamoDb.get(params);
  if ( ! result.Item) {
    throw new Error("Item not found.");
  }
  const offer =  result.Item;
  const offerDetails = offer.offerDetails;
  const applications = offerDetails.applications;
  console.log(applications);
  const unselected = applications.unselected;
  const newObj = {
    "remarkerId" : remarkerId,
    "applicationData" : Date.now()
  };
  unselected.push(newObj);
  console.log(applications);
  const updateParams = {
    TableName: process.env.offersTableName,
    Key: {
      hashKey: offer.hashKey,
      rangeKey: offer.rangeKey
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
