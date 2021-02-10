import dynamoDb from "../../../libs/dynamodb-lib";
const {offerTableName} = process.env;
export function deleteExpiredOffers(expiredOffers){
  let deleteItems = [];
  expiredOffers.forEach( item =>
    deleteItems.push({
      DeleteRequest: {
      Key: {
        'hashKey' : item.hashKey,
        'rangeKey' : item.rangeKey
      }
    }
    })
  );
  let deleteParams = {
    RequestItems: {},
  };
  deleteParams.RequestItems[offerTableName] = deleteItems;
  return dynamoDb.batchWrite(deleteParams);
}
