import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as consts from "./constants.js";
export const main = handler(async (event, context) => {
  const body = JSON.parse(event.body);
  const remarkerId = body.remarkerId;
  if(!remarkerId)
    throw new Error("RemarkerId not present in request");
  const offerId = body.offerId;
  if(!offerId)
    throw new Error("OfferId not present in request");
  const businessId = event.requestContext.identity.cognitoIdentityId;
  const params = {
    TableName: process.env.collaborationsTableName,
    Key : {
      "businessId" : businessId,
      "offerId" : offerId
    }
  };
  const result = await dynamoDb.get(params);
  if ( ! result.Item) {
    throw new Error("Item not found.");
  }
  const collaboration = result.Item;
  const influencers = collaboration.influencers;
  if(!influencers){
    throw new Error("Influencers not present in collaboration, cannot proceed");
  }
  var remarkerFound = false;
  for(let influ of influencers){
    const remarker = influ.remarkerId;
    if(remarker === remarkerId){
      remarkerFound = true;
      break;
    }
  }
  if(remarkerFound){
    const status = consts.statuses.COMPLETED;
    const updateParams = {
        TableName: process.env.offersTableName,
        Key: {
            hashKey : businessId,
            rangeKey: offerId
        },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: {
            "#status": "status"
        },
        ExpressionAttributeValues: {
            ":status": status
        },
        ReturnValues: 'ALL_NEW'
    };
    await dynamoDb.update(updateParams);
    return { status: true };
  }else{
    throw new Error("Remarker not found in collaboration!");
  }
});
