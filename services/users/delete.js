import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const paramsToDelete = {
    TableName: process.env.userTableName,
    Key: {
      "userId": event.requestContext.identity.cognitoIdentityId
    }
  };
  await dynamoDb.delete(paramsToDelete);
  return { status: true };
});
