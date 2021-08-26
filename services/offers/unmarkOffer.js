import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

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
  }
  const unselected = applications.unselected;
  const selected = applications.selected;
  var index = 0;
  var found = false;
  for(let entry of applications.unselected){
    if(entry.remarkerId === remarkerId){
      found = true;
      break;
    }else {
      index++;
    }
  }
  if(found){
    unselected.splice(index,1);
  }
  else {
    index = 0;
    for(let applicant of selected){
      if(applicant.remarkerId === remarkerId){
        found = true;
        break;
      }else{
        index++;
      }
    }
    if(found){
      selected.splice(index,1);
    }else{
      throw new Error("Remarker "+remarkerId+" not found among selected and unselected applicants of the offer " + offer.offerId);
    }
  }
  const updateParams = {
    TableName: process.env.offersTableName,
    Key: {
      hashKey: offer.hashKey,
      rangeKey: offer.rangeKey
    },
    UpdateExpression: "SET offerDetails = :offerDetails",
    ExpressionAttributeValues: {
      ":offerDetails": offerDetails
    },
    ReturnValues: "ALL_NEW"
  };
  await dynamoDb.update(updateParams);
  return { status: true };
});
