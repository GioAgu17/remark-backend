import * as uuid from "uuid";
import handler from "../../libs/handler-lib";
import * as insert from "../../libs/insertOffer-lib";
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const offerId = uuid.v1();
  data.offerId = offerId;
  data.businessId = event.requestContext.identity.cognitoIdentityId;
  await insert.insertOffer(data);
  return offerId;
});
