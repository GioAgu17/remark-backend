import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as consts from "./constants.js";

export const main = handler(async (event, context) => {
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUp - Lambda is warm!');
    return 'Lambda is warm!';
  }
  const date = new Date();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  const yearMonth = parseInt(year+""+month);
  const status = consts.statuses.POSTED;
  const params = {
    TableName: process.env.collaborationTableName,
    IndexName: process.env.exploreIndex,
    KeyConditionExpression: '#ym = :yearMonth and #st = :status',
    ExpressionAttributeNames: {
      "#st" : "status",
      "#ym" : "yearMonth"
    },
    ExpressionAttributeValues: {
      ':yearMonth': yearMonth,
      ':status': status
    }
  };
  const result = await dynamoDb.query(params);
  if ( ! result.Items) {
    throw new Error("Item not found.");
  }
  return result.Items;
});
