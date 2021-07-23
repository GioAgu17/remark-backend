import dynamoDb from "../../../libs/dynamodb-lib";
import * as consts from "./../constants.js";
const {collaborationTableName} = process.env;
export async function main(offerDetails, businessId, offerId, influencerId,
   remarkerUsername, remarkerProfileImage){
  const status = consts.statuses.INPROGRESS;
  const date = new Date();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  const yearMonth = parseInt(year+""+month);
  const details = {
    remarkerUsername: remarkerUsername,
    remarkerProfileImage: remarkerProfileImage,
    offerDetails: offerDetails,
    images: [],
    comments: 0,
    hashtags: [],
    caption: "",
    impactScore: 0,
    likes: 0
  };
  const insertParams = {
    TableName: collaborationTableName,
    Item: {
      businessId: businessId,
      offerId: offerId,
      details: details,
      status : status,
      yearMonth: yearMonth,
      influencerId : influencerId,
      createdAt: new Date().toISOString(),
    }
  };
  await dynamoDb.put(insertParams);
  return { status: true };
}
