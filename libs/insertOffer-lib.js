const {performance} = require('perf_hooks');
var geohash = require('ngeohash');
import dynamodb from "./dynamodb-lib";
import * as uuid from "uuid";

// inserting offer by calculating the geohash and inserting it
export async function insertOffer(data){
    var t0 = performance.now();
    const lat = parseFloat(data.latitude);
    const long = parseFloat(data.longitude);
    console.log(data);
    data.offerDetails.latitude = lat;
    data.offerDetails.longitude = long;
    console.log(data);
    const geohashEncoded = geohash.encode(lat,long);
    console.log(geohashEncoded);
    await persistOffer(geohashEncoded, data);
    var t1 = performance.now();
    console.log("Time took " + (t1-t0) + " ms" );
}


async function persistOffer(geohashEncoded, data){
  console.log(data);
  const params = {
    TableName: process.env.offersTableName,
    Item: {
      hashKey: process.env.partitionKeyOffer,
      rangeKey: uuid.v4(),
      geohash: geohashEncoded,
      businessId : data.businessId,
      offerId : data.offerId,
      offerDetails: data.offerDetails,
      createdAt: new Date().toISOString(),
    }
  };
  await dynamodb.put(params);
}
