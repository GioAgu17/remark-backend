import dynamoDb from "../../../libs/dynamodb-lib";
// Get all the collaborations with status POSTING

export function scanCollabs(){
  const params = {
    TableName : process.env.collaborationTableName,
    FilterExpression : "#st = :status",
    ExpressionAttributeNames: {
      "#st" : "status",
    },
    ExpressionAttributeValues: {
      ':status': "POSTING"
    },
  };
  return dynamoDb.scan(params);
}
