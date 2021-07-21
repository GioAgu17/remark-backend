import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as consts from "./constants.js";
export const main = handler(async (event, context) => {
  const body = JSON.parse(event.body);
  const remarkerId = body.remarkerId;
  if(!remarkerId)
    throw new Error("RemarkerId not present in request");
  const offerId = body.offerId;
  if(!offerId)
    throw new Error("OfferId not present in request");
  const statusToUpdate = consts.statuses.POSTING;
  const updateParams = {
      TableName: process.env.collaborationTableName,
      Key: {
          influencerId : remarkerId,
          offerId: offerId
      },
      UpdateExpression: "SET #st = :statusAttr",
      ExpressionAttributeValues: {
          ":statusAttr": statusToUpdate
      },
      ExpressionAttributeNames: {
        "#st" : "status"
      },
      ReturnValues: 'ALL_NEW'
  };
  await dynamoDb.update(updateParams);
  return { status: true };
});
