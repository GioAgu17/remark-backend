import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

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
  if(Array.isArray(savedOffers) && savedOffers.length != 0){
    const keys = [];
    for(let rangeKey of savedOffers){
      const obj = {
        "hashKey" : process.env.partitionKeyOffer,
        "rangeKey": rangeKey
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
    if ( ! result.Items) {
      throw new Error("Items not found.");
    }
    return result.Items;
  }else {
    return [];
  }
});
