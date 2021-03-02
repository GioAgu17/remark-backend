import AWS from "aws-sdk";
import * as uuid from "uuid";

const ddb = new AWS.DynamoDB();
const ddbGeo = require('dynamodb-geo-regevbr');
const config = new ddbGeo.GeoDataManagerConfiguration(ddb, process.env.offersTableName);
config.longitudeFirst = process.env.longitudeFirst;
// 6 is optimal for a range between 1-10 km
config.hashKeyLength = process.env.hashKeyLength;
const myGeoTableManager = new ddbGeo.GeoDataManager(config);

export function insertOffer(data){
    // inserting lat and long inside offer details as well
    const latitude = parseFloat(data.latitude);
    const longitude = parseFloat(data.longitude);
    data.offerDetails.latitude = latitude;
    data.offerDetails.longitude = longitude;
    const converted = AWS.DynamoDB.Converter.input(data.offerDetails);
    console.log(converted);
    return myGeoTableManager.putPoint({
          RangeKeyValue: { S: uuid.v4() }, // Use this to ensure uniqueness of the hash/range pairs.
          GeoPoint: { // An object specifying latitutde and longitude as plain numbers. Used to build the geohash, the hashkey and geojson data
              latitude: { N: latitude },
              longitude: { N: longitude }
          },
          PutItemInput: {
            Item: {
              businessId : {S: data.businessId},
              offerId : {S: data.offerId},
              offerDetails: converted
            },// Passed through to the underlying DynamoDB.putItem request. TableName is filled in for you.
          }
      }).promise();
      //.then(function() { console.log('Done!'); });
}

export function queryOffersByRadius(data){
  console.log(data.radius);
  const lat = parseFloat(data.lat);
  const long = parseFloat(data.long);
  console.log(lat);
  console.log(long);
  const result = myGeoTableManager.queryRadius({
    RadiusInMeter: data.radius *1,
    CenterPoint: {
        latitude: lat,
        longitude: long
    }
  });
  return result;
}
