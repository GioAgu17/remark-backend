import handler from "./libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const readParams = {
    TableName: process.env.userTableName,
    Key: {
      "userId": event.requestContext.identity.cognitoIdentityId
    }
  };
  const result = await dynamoDb.get(readParams);
  if(!result.Item){
    return "Item not found";
  }
  var userDetailsOld = result.Item.userDetails;
  console.log(userDetailsOld);
  var userDetails = {...userDetailsOld,...data};
  console.log(userDetails);
  const updateParams = {
    TableName: process.env.userTableName,
    Key: {
      "userId": event.requestContext.identity.cognitoIdentityId
    },
    UpdateExpression: "SET userDetails = :userDetails",
    ExpressionAttributeValues: {
      ":userDetails": userDetails
    },
    ReturnValues: "ALL_NEW"
  };
  await dynamoDb.update(updateParams);
  return { status: true };
});
