import dynamoDb from "../../../libs/dynamodb-lib";
// for each user, find the expired offers and then call
// function insertExpiredOffers and function deleteExpiredOffers
export function findUserOffers(item){
  const queryOffers = {
    TableName : process.env.offerTableName,
    IndexName: process.env.offerTableIndex,
    KeyConditionExpression: 'businessId = :bus_id',
    ExpressionAttributeValues: {
      ':bus_id': item.userId
    }
  };
  return dynamoDb.query(queryOffers);
}
