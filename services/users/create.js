import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";
import * as stats from "../statistics/api.js";

export const main = handler(async (event, context) => {
    const data = JSON.parse(event.body);
    const userID = event.requestContext.identity.cognitoIdentityId;

    const fakEvt = { 'pathParameters' : {'id' : data.accountIG} };
    let profileImage = await stats.getProfilePic(fakEvt);
    profileImage = JSON.parse(profileImage.body);

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
                age : data.age,
                caption : data.caption,
                influencerCategories : data.influencerCategories,
            },
            createdAt: Date.now(),
        }
    };
    await dynamoDb.put(params);
    return { status: true };
});
