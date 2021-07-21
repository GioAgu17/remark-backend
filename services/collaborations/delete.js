import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const collaboration = JSON.parse(event.body);
  if(!collaboration.influencerId){
    throw new Error("Cannot delete collaboration without influencerId");
  }
  if(!collaboration.offerId){
    throw new Error("Cannot delete ");
  }
  const params = {
    TableName: process.env.collaborationTableName,
    Key: {
      'influencerId' : collaboration.influencerId,
      'offerId' : collaboration.offerId
    }
  };
  await dynamoDb.delete(params);
  return { status: true };
});
