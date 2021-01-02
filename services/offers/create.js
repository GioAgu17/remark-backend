import * as uuid from "uuid";
import handler from "./libs/handler-lib";
import * as geospatial from "./libs/geospatial-lib";

export const main = handler(async (event, context) => {
  // adding dummy change to deploy
  const data = JSON.parse(event.body);
  const offerID = uuid.v1();
  const businessID = event.requestContext.identity.cognitoIdentityId;
  geospatial.insertOffer(data, businessID, offerID);
  console.log("Offer", offerID, "inserted");
});
