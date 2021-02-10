import dynamoDb from "../../../libs/dynamodb-lib";
const {expiredOffersTable} = process.env;
export function insertExpiredOffers(expiredOffers){
  let putItems = [];
  expiredOffers.forEach( item =>
    putItems.push({
      PutRequest: {
      Item: {
        businessId: item.businessId ,
        offerId: item.offerId,
        offerDetails: item.offerDetails,
        createdAt: Date.now()
      }
    }
    })
  );
  let insertParams = {
    RequestItems: {},
  };
  console.log(putItems);
  insertParams.RequestItems[expiredOffersTable] = putItems;
  return dynamoDb.batchWrite(insertParams);
}
