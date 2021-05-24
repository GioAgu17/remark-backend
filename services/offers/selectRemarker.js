import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const body = JSON.parse(event.body);
  const rangeKey = body.rangeKey;
  if(!rangeKey){
    throw new Error("Cannot proceed without range key");
  }
  const remarkerId = body.remarkerId;
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
  var index = 0;
  var found = false;
  for(let entry of unselected){
    if(entry.remarkerId === remarkerId){
      found = true;
      break;
    }else {
      index++;
    }
  }
  if(!found){
    throw new Error("Cannot find remarker among unselected applicants in offer");
  }else {
    const obj = unselected[index];
    unselected.splice(index,1);
    if(!applications.selected){
      applications.selected = [];
    }
    const selected = applications.selected;
    selected.push(obj);
    const updateParams = {
        TableName: process.env.offersTableName,
        Key: {
            hashKey : offer.hashKey,
            rangeKey: offer.rangeKey
        },
        UpdateExpression: "SET offerDetails.#ri = :newApplications",
        ExpressionAttributeNames: {
            "#ri": "applications"
        },
        ExpressionAttributeValues: {
            ":newApplications": applications
        },
        ReturnValues: 'ALL_NEW'
    };
    await dynamoDb.update(updateParams);
    return { status: true };
  }
});
