import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  if(!data){
    throw new Error("Not getting data to create collaboration test");
  }
  const businessId = data.businessId;
  const offerId = data.offerId;
  const details = data.details;
  const influencerId = data.influencerId;
  const status = data.status;
  const date = new Date();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  const yearMonth = parseInt(year+""+month);
  const createdAt = data.createdAt;
  const insertParams = {
    TableName: process.env.collaborationTableName,
    Item: {
      businessId: businessId,
      offerId: offerId,
      details: details,
      status : status,
      yearMonth: yearMonth,
      influencerId : influencerId,
      createdAt: createdAt,
    }
  };
  await dynamoDb.put(insertParams);
  return { status: true };
});
