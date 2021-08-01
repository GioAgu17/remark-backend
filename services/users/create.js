import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";
import * as stats from "../statistics/api.js";
import * as postValue from "./libs/postValue-lib";
export const main = handler(async (event, context) => {
    const data = JSON.parse(event.body);
    const userID = event.requestContext.identity.cognitoIdentityId;
    const fakEvt = { 'pathParameters' : {'id' : data.accountIG} };
    let profileImage = await stats.getProfilePic(fakEvt);
    profileImage = JSON.parse(profileImage.body);
    let statistics = await stats.userStatistics(fakEvt);
    statistics = JSON.parse(statistics.body);
    const params = {
        TableName: process.env.userTableName,
        Item: {
            // The attributes of the item to be created
            userId : userID,
            userType: data.userType,
            loginInfo : {
                email : data.email
            },
            userDetails: {
                username : data.username,
                accountIG : data.accountIG,
                profileImage : profileImage,
                age : data.userType == 'influencer' ? data.age : null,
                caption : data.caption,
                influencerCategories : data.influencerCategories,
            },
            createdAt: Date.now(),
        }
    };
    if( typeof statistics !== 'undefined' && Object.keys(statistics).length ){
        const averagePostValueNum = postValue.calculateAveragePostValue(statistics.followers, statistics.er);
        const averagePostValue = averagePostValueNum.toString() + "€";
        params.Item.userDetails = Object.assign( params.Item.userDetails, {
            'followers' : statistics.followers,
            'engagementRate' : statistics.er.toString() + "%",
            'website' : data.userType == 'business' ? statistics.website : null,
            'averagePostValue' : data.userType == 'influencer' ? averagePostValue : null,
        });
    }
    await dynamoDb.put(params);
    return { status: true };
});
