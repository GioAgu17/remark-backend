import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as insert from "../../libs/insertOffer-lib";
import * as deleteExpiredOffer from "./libs/deleteExpiredOffer-lib";
export const main = handler(async (event, context) => {

    const data = JSON.parse(event.body);

    let expiredOffersParams = { TableName: process.env.expiredOffersTable };
    var businessId;
    var offerId;
    var expiryDate;
    if(data && data.offerId && data.businessId && data.expiryDate){
        businessId = data.businessId;
        expiryDate = data.expiryDate;
        offerId = data.offerId;
    }else{
        throw new Error("Cannot proceed without offerId, businessId and expiryDate");
    }

    expiredOffersParams.Key = {
        'businessId': businessId,
        'offerId' : offerId
    };
    const result = await dynamoDb.get(expiredOffersParams);

    const expiredOffers =  result.Item ? [result.Item] : [];

    console.log(expiredOffers);
    if(expiredOffers.length){
        // Is it supposed to eventually return multiple results?
        for(let offer of expiredOffers){
            offer.offerDetails.expiryDate = expiryDate;
            offer.latitude = offer.offerDetails.latitude;
            offer.longitude = offer.offerDetails.longitude;
            await insert.insertOffer(offer);
            await deleteExpiredOffer.main(businessId, offer.offerId);
        }
    }
    return { status: true };
});