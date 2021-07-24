import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";
import * as collabStats from "./libs/collabStats-lib";
import * as instaCollabs from "./libs/instaCollab-lib";
export const main = handler(async (event, context) => {
  const params = {
    TableName: process.env.userTableName,
    Key: {
      "userId": event.pathParameters.id
    }
  };
  const result = await dynamoDb.get(params);
  if(!result.Item){
    return "Item not found";
  }
  var userDetails = result.Item.userDetails;
  if(!userDetails){
    throw new Error("User details is not present in user " + event.pathParameters.id);
  }
  userDetails = await collabStats.getCollabStats(event.pathParameters.id, result.Item.userType, userDetails);
  console.log("------- UNO " + userDetails);
  userDetails = await instaCollabs.getInstaStats(userDetails, result.Item.userType);
  console.log("------- DUE " +userDetails);
  result.Item.userDetails = userDetails;
  return result.Item;
});
