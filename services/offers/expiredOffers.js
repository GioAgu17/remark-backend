import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";


export const main = handler(async (event, context) => {
  const businessId = event.requestContext.identity.cognitoIdentityId;
  const expiredOffersParams = {
    TableName: process.env.expiredOffersTable,
    KeyConditionExpression: 'businessId = :businessId',
    ExpressionAttributeValues: {
      ':businessId': businessId,
    }
  };
  const result = await dynamoDb.query(expiredOffersParams);
  if(!result.Items){
    throw new Error("Expired offers not found");
  }
  const expiredOffers = result.Items;
  console.log(expiredOffers);
  return expiredOffers;
});
