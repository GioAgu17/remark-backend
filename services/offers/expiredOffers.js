import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {

    const data = JSON.parse(event.body);
    const businessId = event.requestContext.identity.cognitoIdentityId;

    let expiredOffersParams = { TableName: process.env.expiredOffersTable };
    var offerId;
    if(data && data.offerId){
        offerId = data.offerId;
    }
    if(offerId){
        expiredOffersParams.Key = {
            'businessId': businessId,
            'offerId' : offerId
        };
    }else{
        expiredOffersParams.KeyConditionExpression = 'businessId = :businessId';
        expiredOffersParams.ExpressionAttributeValues = {
            ':businessId': businessId
        };
    }
    const result = offerId ?
        await dynamoDb.get(expiredOffersParams) :
        await dynamoDb.query(expiredOffersParams);

    const expiredOffers = offerId ?
        ( result.Item ? [result.Item] : [] ) :
        result.Items;

    console.log(expiredOffers);
    return expiredOffers;
});
