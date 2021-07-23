import dynamoDb from "../../../libs/dynamodb-lib";
export async function main(influencerIds){
  const readParams = {
    RequestItems: {},
  };
  readParams.RequestItems[process.env.userTableName] = {
    Keys: influencerIds
  };
  const result = await dynamoDb.batchGet(readParams);
  if ( ! result.Responses) {
    throw new Error("Items not found.");
  }
  const users = result.Responses[process.env.userTableName];
  console.log(users);
  return users;
}
