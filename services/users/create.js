import handler from "./libs/handler-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  console.log(data);
  const userID = event.requestContext.identity.cognitoIdentityId;
  /*const params = {
    TableName: process.env.userTableName,
    Item: {
      // The attributes of the item to be created
      userID : userId,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };*/
  return userID;
});
