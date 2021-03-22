import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as uuid from "uuid";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const faqId = uuid.v1();
  console.log(faqId);
  const params = {
    TableName: process.env.faqsTableName,
    Item: {
      // The attributes of the item to be created
      category : data.category,
      faqId: faqId,
      details : data.details,
      createdByUser: event.requestContext.identity.cognitoIdentityId,
      createdAt: Date.now(),
    },
  };
  await dynamoDb.put(params);
  return {
    status: true,
    faqId: faqId
  };
});
