import dynamoDb from "../../../libs/dynamodb-lib";
const {newOfferTableName} = process.env;
export function main(offer){
  const params = {
    TableName: newOfferTableName,
    Key: {
      'hashKey' : offer.hashKey,
      'rangeKey' : offer.rangeKey
    }
  };
  return dynamoDb.delete(params);
}
