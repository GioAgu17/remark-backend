import handler from "./libs/handler-lib";
//import dynamoDb from "./libs/dynamodb-lib";
// adding dummy change to deploy
export const main = handler(async (event, context) => {
/*  const params = {
    TableName: process.env.offersTableName,
    // 'Key' defines the partition key and sort key of the item to be removed
    // - 'businessId': Identity Pool identity id of the authenticated user
    // - 'offerId': path parameter
    Key: {
      businessId: event.requestContext.identity.cognitoIdentityId,
      offerId: event.pathParameters.id
    }
  };

  await dynamoDb.delete(params);

  return { status: true };*/
});
