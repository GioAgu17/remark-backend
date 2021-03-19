import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  console.log(data);
  const params = {
    TableName: process.env.userTableName,
    Key: {
      "userId": event.requestContext.identity.cognitoIdentityId
    },
    UpdateExpression: "SET userDetails = :userDetails",
    ExpressionAttributeValues: {
      ":userDetails": data.userDetails
    },
    ReturnValues: "ALL_NEW"
  };
  await dynamoDb.update(params);
  return { status: true };
});
