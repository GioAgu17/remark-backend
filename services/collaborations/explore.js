import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as consts from "./constants.js";

export const main = handler(async (event, context) => {
  const date = new Date();
  const month = date.getUTCMonth() + 1;
  console.log(month);
  const year = date.getUTCFullYear();
  console.log(year);
  const yearMonth = parseInt(year+""+month);
  const status = consts.statuses.COMPLETED;
  const params = {
    TableName: process.env.collaborationsTableName,
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
