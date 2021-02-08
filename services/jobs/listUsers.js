'use strict';
import dynamoDb from "../../libs/dynamodb-lib";

module.exports.run = (event, context) => {

  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);
};
