import dynamoDb from "../../../libs/dynamodb-lib";
const {expiredOffersTable} = process.env;
export async function insertExpiredOffers(expiredOffers){
  try{
    for(let expiredOffer of expiredOffers){
      const insertParams = {
        TableName: expiredOffersTable,
        Item: {
          businessId: expiredOffer.businessId ,
          offerId: expiredOffer.offerId,
          offerDetails: expiredOffer.offerDetails,
          createdAt: new Date().toISOString()
        }
      };
      await dynamoDb.put(insertParams);
    }
    return true;
  }catch(err){
    return false;
  }
}