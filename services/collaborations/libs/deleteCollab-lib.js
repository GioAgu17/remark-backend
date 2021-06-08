import dynamoDb from "../../../libs/dynamodb-lib";
const {collaborationTableName} = process.env;
export function main(collaboration){
  const params = {
    TableName: collaborationTableName,
    Key: {
      'businessId' : collaboration.businessId,
      'offerId' : collaboration.offerId
    }
  };
  return dynamoDb.delete(params);
}
