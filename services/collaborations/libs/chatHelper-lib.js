import dynamoDb from "../../../libs/dynamodb-lib";
import * as uuid from "uuid";
import AWS from "aws-sdk";
export async function newChat(userIds, businessId, members, offerId){
  const stage = process.env.stage;
  var connections = [];
  const endpoint = process.env.websocketApiId + '/' + stage;
  const agma = new AWS.ApiGatewayManagementApi({
    endpoint: endpoint
  });
  const chatId = uuid.v1();
  const businessMessage = {
    isNewChat : true,
    chatId: chatId,
    text: "Welcome to the chat! Write a nice welcome to the remarker and start scheduling your collaboration!",
    members: members,
    senderId: "remark",
    createdAt: new Date().toISOString()
  };
  const remarkerMessage = {
    isNewChat : true,
    chatId: chatId,
    members: members,
    text: "Welcome to the collaboration chat! Here you get to know better the business, schedule the completion of the collab, and so on!",
    senderId: "remark",
    createdAt: new Date().toISOString()
  };
  for(let userId of userIds){
    const readConnectionParams = {
      TableName: process.env.connectionChatTableName,
      Key: {
        userId: userId
      }
    };
    const result = await dynamoDb.get(readConnectionParams);
    if(!result.Item)
      throw new Error("Connection not found in connection chat table for userId " + userId);
    const connectionId = result.Item.connectionId;
    connections.push(connectionId);
    await updateConnectionChatTable(userId, chatId);
    try {
        await agma.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(remarkerMessage)
        }).promise();
    }
    catch (err) {
        if (err.statusCode === 410) {
            console.log("Got the error " + err);
            throw new Error(err);
        }
        else {
            throw err;
        }
    }
  }
  // now write to the business
  const readBizConnectionParams = {
    TableName: process.env.connectionChatTableName,
    Key: {
      userId: businessId
    }
  };
  const bizResult = await dynamoDb.get(readBizConnectionParams);
  if(!bizResult.Item)
    throw new Error("Cannot find business connection chat for businessId " + businessId);
  const bizConnectionId = bizResult.Item.connectionId;
  connections.push(bizConnectionId);
  await updateConnectionChatTable(businessId, chatId);
  try {
      await agma.postToConnection({
          ConnectionId: bizConnectionId,
          Data: JSON.stringify(businessMessage)
      }).promise();
  }
  catch (err) {
      if (err.statusCode === 410) {
          console.log("Got the error " + err);
          throw new Error(err);
      }
      else {
          throw err;
      }
  }

  // insert new record inside conversationChatTable
  const insertParams = {
    TableName: process.env.conversationChatTableName,
    Item: {
      chatId: chatId,
      connections: connections,
      messages: [],
      members: members,
      offerId : offerId,
      createdAt: new Date().toISOString(),
    }
  };
  await dynamoDb.put(insertParams);
}

async function updateConnectionChatTable(userId, chatId){
  const updateParams = {
      TableName: process.env.connectionChatTableName,
      Key: {
          userId : userId
      },
      UpdateExpression: "SET #chatIds = list_append(#chatIds, :vals)",
      ExpressionAttributeValues: {
          ":vals": [chatId]
      },
      ExpressionAttributeNames: {
        "#chatIds" : "chatIds"
      },
      ReturnValues: 'ALL_NEW'
  };
  await dynamoDb.update(updateParams);
  return;
}
