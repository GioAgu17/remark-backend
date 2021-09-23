import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as read from "./libs/readOffer-lib";
import * as engine from "./libs/engine-lib";
/*
   this part is to show the closest offers
*/
export const main = handler(async (event, context) => {
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUp - Lambda is warm!');
    return 'Lambda is warm!';
  }
  // get the influencer for which we are going to show offers
  const influencerId = event.requestContext.identity.cognitoIdentityId;
  const params = {
    TableName: process.env.userTableName,
    Key: {
      userId: influencerId
    }
  };
  const result = await dynamoDb.get(params);
  if ( ! result.Item) {
    throw new Error("Influencer not found.");
  }
  const influencer = result.Item;
  // get the offers based on the location of the influencer
  const data = JSON.parse(event.body);
  const offers = await read.queryOffersByRadius(data);
  // rank close offers based on some weights
  const offersRanked = await engine.rankOffers(offers, influencer);
  return offersRanked;
});
