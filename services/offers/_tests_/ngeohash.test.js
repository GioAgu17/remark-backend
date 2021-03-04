var geohash = require('ngeohash');

test('ngeohash correctly runs geohash algorithm', () => {
    var t0 = performance.now();
    const lat = 45.4707257268016;
    const long = 9.210218990683801;
    const geohashEncoded = geohash.encode(lat,long,6);
    //console.log(geohashEncoded);
    const lat1 = 45.47614265893888;
    const long1 =   9.20071322694377;
    const geohashEncoded1 = geohash.encode(lat1,long1,6);
    //console.log(geohashEncoded1);
    const latlon = geohash.decode(geohashEncoded,6);
    //console.log(latlon);
    const neighbors = geohash.neighbors(geohashEncoded,6);
    //console.log(neighbors);
    var t1 = performance.now();
    console.log("Time took " + (t1-t0) + " ms" );
});


test('encoding with precision 6 is same as getting the max precision and then truncating it after six digits', () => {
    const lat = 45.4707257268016;
    const long = 9.210218990683801;
    const geoHashLowPrecision = geohash.encode(lat,long,6);
    const geoHashMaxPrecision = geohash.encode(lat,long);
    const geoHashMaxPrecisionTruncated = geoHashMaxPrecision.slice(0,6);
    expect(geoHashLowPrecision).toEqual(geoHashMaxPrecisionTruncated);
});
