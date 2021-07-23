import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as deleteOffer from "./libs/deleteOffer-lib";
import * as insertCollab from "./libs/insertCollab-lib";
import * as readCollab from "./libs/readCollab-lib";
import * as chatHelper from "./libs/chatHelper-lib";
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  if(!data){
    throw new Error("Not getting data to create collaboration");
  }
  const rangeKey = data.rangeKey;
  const readParams = {
    TableName: process.env.offersTableName,
    Key: {
      "hashKey" : process.env.partitionKeyOffer,
      "rangeKey" : rangeKey
    }
  };
  const offerResult = await dynamoDb.get(readParams);
  if(!offerResult.Item){
    throw new Error("Offer not found. Failed to create collaboration");
  }
  const offer = offerResult.Item;
  const businessId = event.requestContext.identity.cognitoIdentityId;
  if(!offer.offerId){
    throw new Error("Offer ID not present in offer with rangeKey: "+rangeKey);
  }
  const offerId = offer.offerId;
  if(!offer.offerDetails){
    throw new Error("Offer details not found in offer. Failed to create collaboration");
  }
  const offerDetails = offer.offerDetails;
  if(!offerDetails.applications){
    throw new Error("Applications not found in offer details. Failed to create collaboration");
  }
  const applications = offerDetails.applications;
  if(!applications.selected){
    throw new Error("Selected applicants not present in applications field of offer. Failed to create collaboration");
  }
  var userIds = applications.selected.map(x => x.remarkerId);
  const users = await readCollab.main(userIds);
  const members = [];
  for(let user of users){
    const member = {};
    member.id = user.userId;
    if(user.userDetails != "undefined"){
      member.username = user.userDetails.username;
      member.image = user.userDetails.profileImage;
    }
    members.push(member);
    await insertCollab.main(offerDetails, businessId, offerId, user.userId, user.userDetails.username, user.userDetails.profileImage);
  }
  // saving member also for business
  const readBusinessInfoParams = {
    TableName: process.env.userTableName,
    Key:{
      userId: businessId
    }
  };
  const res = await dynamoDb.get(readBusinessInfoParams);
  if(!res.Item)
    throw new Error("Did not find any business information with businessId " + businessId);
  const businessMember = {};
  businessMember.id = businessId;
  if(res.Item.userDetails != "undefined"){
    businessMember.image = res.Item.userDetails.profileImage;
    businessMember.username = res.Item.userDetails.username;
  }
  members.push(businessMember);
  await chatHelper.newChat(userIds, businessId, members, offerId);
  await deleteOffer.main(offer);
  return { status: true };
});
