import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as insert from "../../libs/insertOffer-lib";
import * as deleteExpiredOffer from "./libs/deleteExpiredOffer-lib";
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  if(!data.offerId){
    throw new Error("Cannot proceed without offerId");
  }
  if(!data.expiryDate){
    throw new Error("Cannot proceed without expiryDate");
  }
  const readParams = {
    TableName: process.env.expiredOffersTable,
    Key: {
      "businessId": event.requestContext.identity.cognitoIdentityId,
      "offerId": data.offerId
    }
  };
  const result = await dynamoDb.get(readParams);
  if(!result.Item){
    return "Item not found";
  }
  result.Item.offerDetails.expiryDate = data.expiryDate;
  result.Item.latitude = result.Item.offerDetails.latitude;
  result.Item.longitude = result.Item.offerDetails.longitude;
  await insert.insertOffer(result.Item);
  await deleteExpiredOffer.main(event.requestContext.identity.cognitoIdentityId, data.offerId);
  return { status: true };
});
