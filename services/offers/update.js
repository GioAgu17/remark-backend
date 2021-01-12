import handler from "./libs/handler-lib";
//import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {
/*  const data = JSON.parse(event.body);
  const paramsForGettingOffer = {
    TableName: process.env.offersTableName,
    Key: {
      'hashKey': data.hashKey,
      'rangeKey': data.rangeKey
    }
  };
  const offers = await dynamoDb.query(paramsForGettingOffer);
  if(!offers.Items){
    const offer =
    const params = {
      TableName: process.env.offersTableName,
      // 'Key' defines the partition key and sort key of the item to be updated
      // - 'businessId': Identity Pool identity id of the authenticated user
      // - 'offerId': path parameter
      Key: {
        hashKey: offer.hashKey,
        rangeKey: offer.rangeKey
      },
      // 'UpdateExpression' defines the attributes to be updated
      // 'ExpressionAttributeValues' defines the value in the update expression
      UpdateExpression: "SET advFlg = :advFlg, isPost = :isPost, title = :title, description = :description, address = :address, coordinates = := coordinates, offerDescription = :offerDescription, bucketName = :bucketName, offerImages = :offerImages, offerValue = :offerValue, expiryDate = :expiryDate, noOfInfluencers = :noOfInfluencers, noOfFollowersRange = :noOfFollowersRange, ageRange = :ageRange, influencerCategories = :influencerCategories, postCaption = :postCaption, engagementRateRange = :engagementRateRange, postTags = :postTags, postHashtags = :postHashtags, postImages = :postImages, storyType = storyType, storyDescription = :storyDescription, noOfStories = :noOfStories, storyVideoDescription = :storyVideoDescription, storyImages = :storyImages, storyHashtags = :storyHashtags",
      ExpressionAttributeValues: {
        ":businessId": data.businessId || null,
        ":content": data.content || null
      },
      // 'ReturnValues' specifies if and how to return the item's attributes,
      // where ALL_NEW returns all attributes of the item after the update; you
      // can inspect 'result' below to see how it works with different settings
      ReturnValues: "ALL_NEW"
    };
  }


  await dynamoDb.update(params);

  return { status: true };*/
});
