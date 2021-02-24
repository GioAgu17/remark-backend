import dynamoDb from "../../../libs/dynamodb-lib";
const {collaborationsTableName} = process.env;
export function main(collaboration){
  const params = {
    TableName: collaborationsTableName,
    Key: {
      'businessId' : collaboration.businessId,
      'offerId' : collaboration.offerId
    }
  };
  return dynamoDb.delete(params);
}
