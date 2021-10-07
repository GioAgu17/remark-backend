import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";


export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const offerId = data.offerId;
  const businessId = event.requestContext.identity.cognitoIdentityId;

  let conditionExpr = 'businessId = :businessId';
  let attrValues = { ':businessId': businessId };

  if(offerId){
    conditionExpr = conditionExpr + ' and offerId = :offerId';
    attrValues = { ...attrValues, ':offerId': offerId };
  }

  const expiredOffersParams = {
    TableName: process.env.expiredOffersTable,
    KeyConditionExpression: conditionExpr,
    ExpressionAttributeValues: attrValues
  };
  const result = await dynamoDb.query(expiredOffersParams);
// just return an empty array
// if(!result.Items){
//   throw new Error("Expired offers not found");
// }
  const expiredOffers = result.Items;
  console.log(expiredOffers);
  return expiredOffers;
});
