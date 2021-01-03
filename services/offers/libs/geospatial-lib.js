import AWS from "aws-sdk";
import * as uuid from "uuid";

const ddb = new AWS.DynamoDB();
const ddbGeo = require('dynamodb-geo');
const config = new ddbGeo.GeoDataManagerConfiguration(ddb, process.env.offersTableName);
config.longitudeFirst = process.env.longitudeFirst;
// 6 is optimal for a range between 1-10 km
config.hashKeyLength = process.env.hashKeyLength;
const myGeoTableManager = new ddbGeo.GeoDataManager(config);

export async function insertOffer(data, businessID, offerID){
    await myGeoTableManager.putPoint({
          RangeKeyValue: { S: uuid.v4() }, // Use this to ensure uniqueness of the hash/range pairs.
          GeoPoint: { // An object specifying latitutde and longitude as plain numbers. Used to build the geohash, the hashkey and geojson data
              latitude: data.coordinates.latitude *1,
              longitude: data.coordinates.longitude *1
          },
          PutItemInput: { // Passed through to the underlying DynamoDB.putItem request. TableName is filled in for you.
              Item: { // The primary key, geohash and geojson data is filled in for you
                businessId: { S: businessID },
                offerId: { S: offerID },
                createdAt:  { S: Date.now().toString() },
                advFlg: { S: data.advFlg },
                isPost: { S: data.isPost },
                title: { S: data.title },
                description: { S: data.description },
                addressLocation1: { S: data.address.addressLocation1 },
                addressLocation2: { S: data.address.addressLocation2 },
                city: { S: data.address.city },
                state: { S: data.address.state },
                country: { S: data.address.country },
                zipCode: { S: data.address.zipCode },
                offerDescription: { S: data.offerDescription },
                bucketName: { S: data.bucketName },
                offerImages: { SS: data.offerImages},
                offerValue: { S: data.offerValue },
                expiryDate: { S: data.expiryDate },
                noOfInfluencers: { S: data.noOfInfluencers },
                noOfFollowersRange: { S: data.noOfFollowersRange },
                ageRange: { S: data.ageRange },
                influencerCategories: { SS : data.influencerCategories },
                postCaption: { S: data.postCaption },
                postTags: { SS: data.postTags },
                postHashtags: { SS: data.postHashtags },
                postImages: { SS: data.postImages },
                storyType: { S: data.storyType },
                storyDescription: { S: data.storyDescription},
                noOfStories: { S: data.noOfStories},
                storyVideoDescription: { S: data.storyVideoDescription},
                storyImages: { SS: data.storyImages},
                storyHashtags: { SS: data.storyHashtags},
                engagementRateRange: { S: data.engagementRateRange}
            },   // ... Anything else to pass through to `putItem`, eg ConditionExpression
          }
      });
      console.log("Offer", offerID, "inserted");
}

export function queryOffersByRadius(data){
  return myGeoTableManager.queryRadius({
    RadiusInMeter: data.radius *1,
    CenterPoint: {
        latitude: data.lat *1,
        longitude: data.long *1
    }
  });
}
