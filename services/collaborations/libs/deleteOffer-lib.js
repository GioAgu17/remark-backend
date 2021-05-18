import dynamoDb from "../../../libs/dynamodb-lib";
const {offersTableName} = process.env;
export function main(offer){
  const params = {
    TableName: offersTableName,
    Key: {
      'hashKey' : offer.hashKey,
      'rangeKey' : offer.rangeKey
    }
  };
  return dynamoDb.delete(params);
}
