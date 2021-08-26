import AWS from "aws-sdk";

const client = new AWS.S3({
  accessKeyId : "AKIAYKL52JU4QA64AMXP",
  secretAccessKey: "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"
});

export default {
  get   : (params) => client.getObject(params).promise(),
  put   : (params) => client.putObject(params).promise(),
};
