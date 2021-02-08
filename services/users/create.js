import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";
import AWS from "aws-sdk";
const s3 = new AWS.S3();
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  console.log(data);
  const userID = event.requestContext.identity.cognitoIdentityId;
  const params = {
    TableName: process.env.userTableName,
    Item: {
      // The attributes of the item to be created
      userId : userID,
      userType: data.userType,
      loginInfo : data.loginInfo,
      userDetails: data.userDetails,
      createdAt: Date.now(),
    },
  };
  await dynamoDb.put(params);
  console.log("Updating list of users in S3");
  const bucketName = process.env.uploadsBucketName;
  const fileName = process.env.usersFileName;
  const s3params = {
        Bucket: bucketName,
        Key: fileName
    };
  await s3.getObject(s3params, function(err, data) {
      if (err) {
          console.log(err);
          var message = "Error getting object " + fileName + " from bucket " + bucketName +
              ". Make sure they exist and your bucket is in the same region as this function.";
          console.log(message);
          context.fail(message);
      } else {
          console.log('CONTENT TYPE getObject:', data.ContentType);
          // convert body(file contents) to a string so we can append
          var body = data.Body.toString('utf-8');
          // append data
          body += userID+"\n";

          var params_new = {
              Bucket: bucketName,
              Key: fileName,
              Body: body
          };
          //NOTE this call is now nested in the s3.getObject call so it doesn't happen until the response comes back
          s3.putObject(params_new, function(err, data) {
                      console.log('put here');
                      if (err) {
                          console.log(err);
                          var message = "Error getting object " + fileName + " from bucket " + bucketName +
                              ". Make sure they exist and your bucket is in the same region as this function.";
                          console.log(message);
                          context.fail(message);
                      } else {
                          console.log('CONTENT TYPE putObject:', data.ContentType);
                          context.succeed(data.ContentType);
                      }
          });

      }
  });
  return { status: true };
});
