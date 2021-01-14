import * as uuid from "uuid";
import handler from "./libs/handler-lib";
import * as geospatial from "./libs/geospatial-lib";
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const offerId = uuid.v1();
  data.offerId = offerId;
  data.businessId = event.requestContext.identity.cognitoIdentityId;
  await geospatial.insertOffer(data);
  console.log(data);
  return data;
});
