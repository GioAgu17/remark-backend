import AWS from "aws-sdk";
const s3 = new AWS.S3();

export default {
  put   : (params) => s3.putObject(params).promise(),
};
