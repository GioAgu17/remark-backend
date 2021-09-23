import dynamoDb from "../../../libs/dynamodb-lib";
import * as consts from "../../collaborations/constants.js";
// Get all the collaborations with status POSTING

export function scanCollabs(){

    let d = new Date();
    const currentMonth = d.getMonth() + 1;
    let dstr = d.toLocaleDateString('en-US');
    dstr = dstr.split("/");
    const yearMonth = parseInt(dstr[2] + currentMonth);

    return dynamoDb.query({
          TableName: process.env.collaborationTableName,
          IndexName: process.env.exploreIndex,
          KeyConditionExpression: '#ym = :yearMonth and #st = :status',
          ExpressionAttributeNames: {
            "#st" : "status",
            "#ym" : "yearMonth"
          },
          ExpressionAttributeValues: {
            ':yearMonth': yearMonth,
            ':status': consts.statuses.POSTING
          }
    });

  // const params = {
  //   TableName : process.env.collaborationTableName,
  //   FilterExpression : "#st = :status",
  //   ExpressionAttributeNames: {
  //     "#st" : "status",
  //   },
  //   ExpressionAttributeValues: {
  //     ':status': "POSTING"
  //   },
  // };
  // return dynamoDb.scan(params);
}
