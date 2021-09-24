import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as createCollab from "../collaborations/create.js";
export const main = handler(async (event, context) => {
  const rangeKey = event.pathParameters.id;
  if(!rangeKey){
    throw new Error("Cannot proceed without range key");
  }
  const remarkerId = event.requestContext.identity.cognitoIdentityId;
  const params = {
    TableName: process.env.offersTableName,
    Key: {
      "hashKey" : process.env.partitionKeyOffer,
      "rangeKey": rangeKey
    }
  };
  const result = await dynamoDb.get(params);
  if ( ! result.Item) {
    throw new Error("Item not found.");
  }
  const offer =  result.Item;
  const offerDetails = offer.offerDetails;
  var applications = offerDetails.applications;
  if(!applications){
    applications = {
      "selected": [],
      "unselected": []
    };
    offerDetails.applications = applications;
  }
  const allowMacroInfluencers = offerDetails.allowMacroInfluencers;
  if( typeof allowMacroInfluencers !== "undefined" && allowMacroInfluencers === true && isMacroInfluencer(remarkerId)){
    // insert remarker in selected applications in the offer
    applications.unselected = [];
    applications.selected = [];
    const selected = applications.selected;
    const newObj = {
      "remarkerId" : remarkerId,
      "applicationDate" : new Date().toISOString()
    };
    selected.push(newObj);
    const updateParams = {
      TableName: process.env.offersTableName,
      Key: {
        hashKey: offer.hashKey,
        rangeKey: offer.rangeKey
      },
      UpdateExpression: "SET offerDetails = :offerDetails",
      ExpressionAttributeValues: {
        ":offerDetails": offerDetails
      }
    };
    await dynamoDb.update(updateParams);
    event.body = {
        rangeKey: offer.rangeKey,
        businessId: offer.businessId 
    };
    return await createCollab.main(event);
  }else{
    const unselected = applications.unselected;
    const newObj = {
      "remarkerId" : remarkerId,
      "applicationDate" : new Date().toISOString()
    };
    unselected.push(newObj);
    const updateParams = {
      TableName: process.env.offersTableName,
      Key: {
        hashKey: offer.hashKey,
        rangeKey: offer.rangeKey
      },
      UpdateExpression: "SET offerDetails = :offerDetails",
      ExpressionAttributeValues: {
        ":offerDetails": offerDetails
      }
    };
    await dynamoDb.update(updateParams);
    return { status: true };
  }
});

async function isMacroInfluencer(remarkerId){
  const readParams = {
    TableName: process.env.userTableName,
    Key: {
      userId: remarkerId
    }
  };
  const res = await dynamoDb.get(readParams);
  if(!res || typeof res === "undefined")
    throw new Error("Cannot read user information with userId " + remarkerId);
  const remarker = res.Item;
  const userDetails = remarker.userDetails;
  if(!userDetails || typeof userDetails === "undefined")
    throw new Error("User doesn't have user details with userId " + remarkerId);
  const followers = userDetails.followers;
  if(!followers || typeof followers === "undefined")
    throw new Error("Followers is blank or null for userId " + remarkerId);
  const allowMacroInfluThreshold = parseInt(process.env.allowMacroInfluencersThreshold);
  console.log(allowMacroInfluThreshold);
  if(followers >= allowMacroInfluThreshold)
    return true;
  else
    return false;
}
