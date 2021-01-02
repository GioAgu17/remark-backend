import handler from "./libs/handler-lib";
import * as geospatial from "./libs/geospatial-lib";
import dynamoDb from "./libs/dynamodb-lib";
import * as engine from "./libs/engine-lib";

export const main = handler(async (event, context) => {
  console.time("listOffersForInflu");
  const data = JSON.parse(event.body);
  const offers = await geospatial.queryOffersByRadius(data);
  console.log(offers);
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
  console.log(influencer);
  engine.rankOffers(offers, influencer);
});
