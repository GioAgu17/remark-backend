import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

/*
  Retrieving saved offers for a remarker, by reading the parameter savedOffers in user TableName
  and then reading batch of items from offers table with the range keys obtained from first query
*/
export const main = handler(async (event, context) => {
  const remarkerId = event.requestContext.identity.cognitoIdentityId;
  const userParams = {
    TableName: process.env.userTableName,
    Key: {
      userId: remarkerId
    }
  };
  const remarkerResult = await dynamoDb.get(userParams);
  if(!remarkerResult.Item){
    throw new Error("Remarker not found");
  }
  const remarker = remarkerResult.Item;
  const savedOffers = remarker.userDetails.savedOffers;
  console.log(savedOffers);
  if(Array.isArray(savedOffers) && savedOffers.length != 0){
    const keys = [];
    for(let rangeKey of savedOffers){
      const obj = {
        hashKey : process.env.partitionKeyOffer,
        rangeKey: rangeKey
      };
      keys.push(obj);
    }
    console.log(keys);
    const { offersTableName } = process.env;
    const readParams = {
      RequestItems: {},
    };
    readParams.RequestItems[offersTableName] = {
      Keys: keys
    };
    const result = await dynamoDb.batchGet(readParams);
    if ( ! result.Responses) {
      throw new Error("Items not found.");
    }
    return result.Responses[offersTableName];
  }else {
    return [];
  }
});
