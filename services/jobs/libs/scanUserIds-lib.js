import dynamoDb from "../../../libs/dynamodb-lib";
// scan the User table to get all user ids with type business
export function scanUserIds(){
  const params = {
    TableName : process.env.userTableName,
    FilterExpression : "userType = :userTyp",
    ExpressionAttributeValues : {
      ":userTyp" : "business"
    },
    ProjectionExpression : "userId",
  };
  return dynamoDb.scan(params);
}
