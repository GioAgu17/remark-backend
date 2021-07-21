import dynamoDb from "../../../libs/dynamodb-lib";
const {collaborationTableName} = process.env;
export async function main(collaborations){
  for(let collaboration of collaborations){
    const params = {
      TableName: collaborationTableName,
      Key: {
        'influencerId' : collaboration.influencerId,
        'offerId' : collaboration.offerId
      }
    };
    dynamoDb.delete(params);
  }
  return { status: true };
}
