import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const params = {
    TableName: process.env.offersTableName,
    IndexName: process.env.offerTableIndex,
    KeyConditionExpression: 'businessId = :bus_id and offerId = :off_id',
    ExpressionAttributeValues: {
      ':bus_id': event.requestContext.identity.cognitoIdentityId,
      ':off_id': event.pathParameters.id
    }
  };
  const result = await dynamoDb.query(params);
  if(!result.Items){
    throw new Error("Item to delete not found.");
  }
  const offerToDelete = result.Items[0];
  const hashKey = offerToDelete.hashKey;
  const rangeKey = offerToDelete.rangeKey;
  const paramsToDelete = {
    TableName: process.env.offersTableName,
    Key: {
      "hashKey": hashKey,
      "rangeKey": rangeKey
    },
    ConditionExpression: "businessId = :businessId and offerId = :offerId",
    ExpressionAttributeValues: {
      ":businessId": event.requestContext.identity.cognitoIdentityId,
      ":offerId": event.pathParameters.id
    }
  };
  await dynamoDb.delete(paramsToDelete);
  return { status: true };
});
