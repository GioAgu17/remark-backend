import handler from "../../libs/handler-lib";
import * as insert from "../../libs/insertOffer-lib";
import * as deleteExpiredOffer from "./libs/deleteExpiredOffer-lib";
import * as expiredOffers from "./expiredOffers.js";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);

  if(!data.expiryDate){
    throw new Error("Cannot proceed without expiryDate");
  }

  let expiredoffers = await expiredOffers.main(event);
  expiredoffers = JSON.parse(expiredoffers.body);
  if(expiredoffers.length){
      // Is it supposed to eventually return multiple results?
      for(let offer of expiredoffers){
          offer.offerDetails.expiryDate = data.expiryDate;
          offer.latitude = offer.offerDetails.latitude;
          offer.longitude = offer.offerDetails.longitude;
          await insert.insertOffer(offer);
          await deleteExpiredOffer.main(event.requestContext.identity.cognitoIdentityId, offer.offerId);
      }
  }
  return { status: true };
});
