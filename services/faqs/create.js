import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";
import * as uuid from "uuid";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const faqId = uuid.v1();
  const params = {
    TableName: process.env.faqTableName,
    Item: {
      // The attributes of the item to be created
      category : data.category,
      faqId: faqId,
      body : data.body,
      createdByUser: data.user,
      createdAt: Date.now(),
    },
  };
  await dynamoDb.put(params);
  return {
    status: true,
    faqId: faqId
  };
});
