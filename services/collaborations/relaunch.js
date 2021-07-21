import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as insert from "../../libs/insertOffer-lib";
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  if(!data){
    throw new Error("Not getting data to relaunch offer from collaboration");
  }
  const params = {
    TableName: process.env.collaborationTableName,
    IndexName: process.env.collaborationTableIndex,
    KeyConditionExpression: '#bi = :businessId and #ofId = :offerId',
    ExpressionAttributeNames: {
      "#bi" : "businessId",
      "#ofId" : "offerId"
    },
    ExpressionAttributeValues: {
      ':businessId': event.requestContext.identity.cognitoIdentityId,
      ':offerId': data.offerId
    }
  };
  const result = await dynamoDb.query(params);
  if ( ! result.Items) {
    throw new Error("Items not found.");
  }
  const collaborations = result.Items;
  const offerDetails = collaborations[0].details.offerDetails;
  if(!offerDetails)
    throw new Error("Offer details not present in collaboration, cannot determine lat and long");
  const offerParams = {
    "offerId" : data.offerId,
    "businessId" : event.requestContext.identity.cognitoIdentityId,
    "offerDetails" : offerDetails,
    "latitude" : offerDetails.latitude,
    "longitude" : offerDetails.longitude
  };
  console.log(offerParams);
  await insert.insertOffer(offerParams);
  for(let collaboration of collaborations){
    const params = {
      TableName: process.env.collaborationTableName,
      Key: {
        'influencerId' : collaboration.influencerId,
        'offerId' : collaboration.offerId
      }
    };
    await dynamoDb.delete(params);
  }
  return { status: true };
});
