import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  var collabs;
  if(!data || data === "undefined")
    throw new Error("Cannot proceed without payload to show collaborations");
  if(!data.userId || data.userId === "undefined")
    throw new Error("Cannot proceed without information on userId to show collaborations");
  if(!data.visiblity || data.visibility === "undefined" || data.visiblity != "private"){
    const queryParams = {
      TableName: process.env.collaborationTableName,
      KeyConditionExpression: '#id = :id',
      FilterExpression: '#st = :status',
      ExpressionAttributeNames: {
        "#st" : "status",
        "#id" : "influencerId"
      },
      ExpressionAttributeValues: {
        ':status': "POSTED",
        ':id': data.userId
      }
    };
    collabs = await dynamoDb.query(queryParams);
  }else{
    console.log(data.visibility);
    const queryParams = {
      TableName: process.env.collaborationTableName,
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        "#id" : "influencerId"
      },
      ExpressionAttributeValues: {
        ':id': data.userId
      }
    };
    collabs = await dynamoDb.query(queryParams);
  }
  if ( ! collabs.Items || collabs.Items === "undefined") {
    throw new Error("Collaborations not found.");
  }
  return collabs.Items;
});
