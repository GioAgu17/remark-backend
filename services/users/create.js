import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const userID = event.requestContext.identity.cognitoIdentityId;
  const params = {
    TableName: process.env.userTableName,
    Item: {
      // The attributes of the item to be created
      userId : userID,
      userType: data.userType,
      loginInfo : data.loginInfo,
      userDetails: data.userDetails,
      createdAt: Date.now(),
    },
  };
  await dynamoDb.put(params);
  return { status: true };
});
