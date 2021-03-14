const request = require('../mocks/mark-offer-event');
import dynamoDb from "../../libs/dynamodb-lib";
test('mark offer', () => {
  const offerId = request.offerId;
  const businessId = request.businessId;
  const influencerId = request.influencerId;
  const params = {
    TableName: process.env.offersTableName,
    IndexName: process.env.offerTableIndex,
    KeyConditionExpression: 'businessId = :bus_id and offerId = :off_id',
    ExpressionAttributeValues: {
      ':bus_id': event.requestContext.identity.cognitoIdentityId,
      ':off_id': event.pathParameters.id
    }
  };
  const result = await dynamoDb.query(params);
  const offer = result.Items[0];
  console.log(offer);
  const offerDetails = offer.offerDetails;
  const applications = offerDetails.applications;
  console.log(applications);
  applications.unselected.push(influencerId);
  const updateParams = {
    TableName: process.env.offersTableName,
    Key: {
      hashKey: offer.hashKey,
      rangeKey: offer.rangeKey
    },
    UpdateExpression: "SET offerDetails = :offerDetails",
    ExpressionAttributeValues: {
      ":offerDetails": offerDetails
    },
    ReturnValues: "ALL_NEW"
  };
  dynamoDb.update(params);
});
