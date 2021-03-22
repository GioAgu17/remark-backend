const {performance} = require('perf_hooks');
var geohash = require('ngeohash');
import * as dynamoDBManager from "./dbmanager-lib";

export async function queryOffersByRadius(data){
  var t0 = performance.now();
  const lat = parseFloat(data.lat);
  const long = parseFloat(data.long);
  const geohashes = calculateGeoHashes(lat,long);
  const result = await dispatchQueries(geohashes);
  var t1 = performance.now();
  console.log("Logging performance of query offers by radius: " + (t1-t0) + " ms");
  return result;
}

async function dispatchQueries(geohashes) {
    const promises = geohashes.map(geoHash => {
      const hashKey = process.env.partitionKeyOffer;
      return dynamoDBManager.queryGeohash(hashKey, geoHash);
    });
    const results = await Promise.all(promises);
    const mergedResults = [];
    results.forEach(queryOutputs => queryOutputs.forEach(queryOutput => mergedResults.push(...queryOutput.Items)));
    return mergedResults;
  }

  function calculateGeoHashes(lat, long){
    const hashKeyLength = process.env.hashKeyLength*1;
    const point = geohash.encode(lat, long, hashKeyLength);
    var neighbors = geohash.neighbors(point, hashKeyLength);
    neighbors.push(point);
    return neighbors;
  }
