import dynamoDb from "../../../libs/dynamodb-lib";
const {offerTableName} = process.env;
export async function deleteExpiredOffers(expiredOffers){
  for(let offer of expiredOffers){
    const deleteParams = {
      TableName: offerTableName,
      Key: {
        hashKey: offer.hashKey,
        rangeKey: offer.rangeKey
      }
    };
    await dynamoDb.delete(deleteParams);
    console.log("Deleted offer with rangeKey: " + offer.rangeKey);
  }
}
