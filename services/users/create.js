import handler from "./libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as stats from "../statistics/api.js";
import * as instaCollabs from "./libs/instaCollab-lib";
export const main = handler(async (event, context) => {
    const data = JSON.parse(event.body);
    const userID = event.requestContext.identity.cognitoIdentityId;
    const fakEvt = { 'pathParameters' : {'id' : data.accountIG} };
    let profileImage =  await stats.getProfilePic(fakEvt);
    console.log(data);
    const params = {
        TableName: process.env.userTableName,
        Item: {
            userId : userID,
            userType: data.userType,
            loginInfo : {
                email : data.email
            },
            userDetails: {
                username : data.username,
                accountIG : data.accountIG,
                profileImage : JSON.parse(profileImage.body),
                age : data.userType == 'influencer' ? data.age : null,
                caption : data.caption,
                influencerCategories : data.influencerCategories,
                gender: data.gender,
                savedOffers: []
            },
            createdAt: Date.now(),
        }
    };
    params.Item.userDetails = await instaCollabs.getInstaStats(params.Item.userDetails, data.userType);
    await dynamoDb.put(params);
    return { status: true };
});