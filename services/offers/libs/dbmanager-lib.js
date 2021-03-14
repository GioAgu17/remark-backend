import dynamodb from "../../../libs/dynamodb-lib";

 export async function queryGeohash(hashKey,geohash){
  const queryOutputs = [];
  async function nextQuery(lastEvaluatedKey){
    const params = {
      TableName : process.env.offersTableName,
      IndexName: "geohash-index",
      KeyConditionExpression: "hashKey = :hashKey AND begins_with(geohash, :geohash)",
      ExpressionAttributeValues: {
        ":hashKey" : hashKey,
        ":geohash" : geohash
      },
      ExclusiveStartKey: lastEvaluatedKey
    };
    const queryOutput = await dynamodb.query(params);
    queryOutputs.push(queryOutput);
    if(queryOutput.LastEvaluatedKey){
      return nextQuery(queryOutput.LastEvaluatedKey);
    }
  };
  await nextQuery();
  return queryOutputs;
}
