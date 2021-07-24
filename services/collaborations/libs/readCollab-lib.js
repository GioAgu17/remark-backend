import dynamoDb from "../../../libs/dynamodb-lib";
export async function main(influencerIds){
  const readParams = {
    RequestItems: {},
  };
  var keys = [];
  for(let remarkerId of influencerIds){
    const obj = {
      userId : remarkerId
    };
    keys.push(obj);
  }
  readParams.RequestItems[process.env.userTableName] = {
    Keys: keys
  };
  const result = await dynamoDb.batchGet(readParams);
  if ( ! result.Responses) {
    throw new Error("Items not found.");
  }
  const users = result.Responses[process.env.userTableName];
  console.log(users);
  return users;
}
