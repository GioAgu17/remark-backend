import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as expiredOffers from "./expiredOffers.js";

/*
  listing all the offers for a particular business
*/
export const main = handler(async (event, context) => {
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUp - Lambda is warm!');
    return 'Lambda is warm!';
  }
  const params = {
    TableName: process.env.offersTableName,
    IndexName: process.env.offerTableIndex,
    KeyConditionExpression: 'businessId = :bus_id',
    ExpressionAttributeValues: {
      ':bus_id': event.requestContext.identity.cognitoIdentityId,
    }
  };
  const result = await dynamoDb.query(params);

  let expiredoffers = await expiredOffers.main(event);
  expiredoffers = JSON.parse(expiredoffers.body);

  const retval = [...result.Items, ...expiredoffers];
  
  // I did fix the check on the empty result,
  // but should we really throw an error rather then just return an empty set?
  if (! retval.length)
    throw new Error("Item not found.");
  return retval;
});
