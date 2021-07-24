import dynamoDb from "../../../libs/dynamodb-lib";
export async function main(businessId, offerId){
  const deleteParams = {
    TableName: process.env.expiredOffersTable,
    Key: {
      businessId: businessId,
      offerId: offerId
    }
  };
  await dynamoDb.delete(deleteParams);
  return;
}
