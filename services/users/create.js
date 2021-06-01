import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";
export const main = handler(async (event, context) => {
    const data = JSON.parse(event.body);
    const userID = event.requestContext.identity.cognitoIdentityId;
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
