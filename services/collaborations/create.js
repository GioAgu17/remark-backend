import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as deleteOffer from "./libs/deleteOffer-lib";
import * as consts from "./constants.js";
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  if(!data){
    throw new Error("Not getting data to create collaboration");
  }
  const influencerId = data.influencerId;
  const offer = data.offer;
  const params = {
    TableName: process.env.collaborationsTableName,
    Item: {
      businessId : offer.businessId,
      offerId : offer.offerId,
      influencerId : influencerId,
      details: offer.offerDetails,
      status: consts.statuses.INPROGRESS,
      createdAt: Date.now(),
    }
  };
  await dynamoDb.put(params);
  await deleteOffer.main(offer);
  return { status: true };
});
