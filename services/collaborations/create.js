import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as deleteOffer from "./libs/deleteOffer-lib";
import * as consts from "./constants.js";
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  if(!data){
    throw new Error("Not getting data to create collaboration");
  }
  const rangeKey = data.rangeKey;
  const readParams = {
    TableName: process.env.offersTableName,
    Key: {
      "hashKey" : process.env.partitionKeyOffer,
      "rangeKey" : rangeKey
    }
  };
  const offerResult = await dynamoDb.get(readParams);
  if(!offerResult.Item){
    throw new Error("Offer not found. Failed to create collaboration");
  }
  const offer = offerResult.Item;
  const businessId = event.requestContext.identity.cognitoIdentityId;
  if(!offer.offerId){
    throw new Error("Offer ID not present in offer with rangeKey: "+rangeKey);
  }
  const offerId = offer.offerId;
  if(!offer.offerDetails){
    throw new Error("Offer details not found in offer. Failed to create collaboration");
  }
  const offerDetails = offer.offerDetails;
  if(!offerDetails.applications){
    throw new Error("Applications not found in offer details. Failed to create collaboration");
  }
  const applications = offerDetails.applications;
  if(!applications.selected){
    throw new Error("Selected applicants not present in applications field of offer. Failed to create collaboration");
  }
  const selected = applications.selected;
  const influencers = selected;
  const status = consts.INPROGRESS;
  const details = {
    offerDetails: offerDetails,
    images: [],
    comments: 0,
    hashtags: [],
    caption: "",
    impactScore: 0,
    likes: 0
  };
  const insertParams = {
    TableName: process.env.collaborationsTableName,
    Item: {
      businessId: businessId,
      offerId: offerId,
      details: details,
      status : status,
      influencers : influencers,
      createdAt: Date.now(),
    }
  };
  await dynamoDb.put(insertParams);
  await deleteOffer.main(offer);
  return { status: true };
});
