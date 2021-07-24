import * as consts from "./../constants.js";
import dynamoDb from "./dynamodb-lib";
export async function getCollabStats(userId, userType, userDetails){
    if(userType == "business"){
      const collabParams = {
        TableName : process.env.collaborationsTableName,
        IndexName: process.env.collabBusinessIndex,
        KeyConditionExpression: "businessId = :businessId",
        ExpressionAttributeValues: {
          ":businessId" : userId
        }
      };
      const businessCollabs = await dynamoDb.query(collabParams);
      userDetails = Object.assign(userDetails, {
        "totalCollabs" : businessCollabs.Count,
        "activeCollabs" : calculateActiveCollabsCount(businessCollabs)
      });
    }else{
      const collabsParams = {
        TableName: process.env.collaborationsTableName,
        KeyConditionExpression: 'influencerId = :influId',
        ExpressionAttributeValues: {
            ':influId': userId
        }
      };
      const influCollabs = await dynamoDb.query(collabsParams);
      userDetails = Object.assign(userDetails, {
        "totalCollabs" : influCollabs.Count,
        "activeCollabs" : calculateActiveCollabsCount(influCollabs)
      });
    }
    return userDetails;
}

function calculateActiveCollabsCount(collabs){
  var activeBusinessCollabs = 0;
  if(collabs.Items){
    for(let collab of collabs.Items){
      if(collab.status === consts.statuses.POSTING || collab.status === consts.statuses.INPROGRESS)
        activeBusinessCollabs++;
    }
  }
  return activeBusinessCollabs;
}
