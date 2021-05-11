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
      },
      UpdateExpression: "SET userDetails.#ri = list_append(if_not_exists(userDetails.#ri, :empty_list), :vals)",
      ExpressionAttributeNames: {
          "#ri": "savedOffers"
      },
      ExpressionAttributeValues: {
          ":vals": [rangeKey],
          ":empty_list": []
      },
      ReturnValues: 'ALL_NEW'
  };
  await dynamoDb.update(params);
  return { status: true };
});
