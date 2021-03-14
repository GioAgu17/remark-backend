import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const request = JSON.parse(event.body);
  const offerId = request.offerId;
  const businessId = request.businessId;
  const influencerId = request.influencerId;
  const params = {
    TableName: process.env.offersTableName,
    IndexName: process.env.offerTableIndex,
    KeyConditionExpression: 'businessId = :bus_id and offerId = :off_id',
    ExpressionAttributeValues: {
      ':bus_id': businessId,
      ':off_id': offerId
    }
  };
  const result = await dynamoDb.query(params);
  if ( ! result.Items) {
    throw new Error("Item not found.");
  }
  const offer =  result.Items[0];
  const offerDetails = offer.offerDetails;
  const applications = offerDetails.applications;
  console.log(applications);
  applications.unselected.push(influencerId);
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
  dynamoDb.update(updateParams);
});
