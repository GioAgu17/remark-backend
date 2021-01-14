import * as uuid from "uuid";
import handler from "./libs/handler-lib";
import * as geospatial from "./libs/geospatial-lib";
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const offerId = uuid.v1();
  data.offerDetails.offerId = offerId;
  data.offerDetails.businessId = event.requestContext.identity.cognitoIdentityId;
  await geospatial.insertOffer(data);
  return data;
});
