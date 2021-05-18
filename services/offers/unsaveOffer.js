import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const rangeKey = event.pathParameters.id;
  if(!rangeKey){
    throw new Error("Cannot proceed without range key");
  }
  const remarkerId = event.requestContext.identity.cognitoIdentityId;
  const params = {
      TableName: process.env.userTableName,
      Key: {
          "userId": remarkerId
      }
    };
  const remarkerResult = await dynamoDb.get(params);
  if(!remarkerResult.Item){
    throw new Error("Remarker not found");
  }
  const remarker = remarkerResult.Item;
  const savedOffers = remarker.userDetails.savedOffers;
  if(Array.isArray(savedOffers) && savedOffers.length != 0){
    const index = savedOffers.indexOf(rangeKey);
    if(index > -1){
      savedOffers.splice(index,1);
    }else{
      throw new Error("range key " + rangeKey + " not found in saved offers");
    }
  }
  const updateParams = {
      TableName: process.env.userTableName,
      Key: {
          "userId": remarkerId
      },
      UpdateExpression: "SET userDetails.#ri = :newSavedOffers",
      ExpressionAttributeNames: {
          "#ri": "savedOffers"
      },
      ExpressionAttributeValues: {
          ":newSavedOffers": savedOffers
      },
      ReturnValues: 'ALL_NEW'
  };
  await dynamoDb.update(updateParams);
  return { status: true };
});
