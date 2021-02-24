import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as geospatial from "../../libs/geospatial-lib";
import * as deleteCollab from "./libs/deleteCollab-lib.js";
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  if(!data){
    throw new Error("Not getting data to relaunch offer from collaboration");
  }
  const params = {
    TableName: process.env.collaborationsTableName,
    Key : {
      "businessId" : data.businessId,
      "offerId" : data.offerId
    }
  };
  const result = await dynamoDb.get(params);
  if ( ! result.Item) {
    throw new Error("Item not found.");
  }
  const collaboration = result.Item;
  const offerParams = {
    "offerId" : data.offerId,
    "businessId" : data.businessId,
    "offerDetails" : collaboration.details,
    "latitude" : collaboration.details.latitude,
    "longitude" : collaboration.details.longitude
  };
  await geospatial.insertOffer(offerParams);
  await deleteCollab.main(collaboration);
  return { status: true };
});
