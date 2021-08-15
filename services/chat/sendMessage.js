import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as chatSender from "../../libs/chatSender-lib";
export const main = handler(async (event, context) => {
  const connectionId = event.requestContext.connectionId;
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  console.log("Process message ", connectionId, event.body);
  const payload = JSON.parse(event.body);
  if(!payload.chatId || !payload.text || !payload.createdAt || !payload.senderId){
    throw new Error("No chatId or text or createdAt or senderId is present in message from message " + payload);
  }
  const chatId = payload.chatId;
  const readParams = {
    TableName: process.env.conversationChatTableName,
    Key:{
      chatId: chatId
    }
  };
  const result = await dynamoDb.get(readParams);
  if(!result.Item){
    throw new Error("No record was found in conversation table with chatId " + chatId);
  }
  const conversation = result.Item;
  if(!conversation.members)
    throw new Error("Cannot send message to chat as there are no members in chat " + chatId);
  // send messages to all connections but the one sending this message
  var connectionsToSend = conversation.connections;
  const indexConnection = connectionsToSend.indexOf(connectionId);
  connectionsToSend.splice(indexConnection, 1);
  const message = {
    chatId: chatId,
    text: payload.text,
    senderId: payload.senderId,
    createdAt: payload.createdAt,
    members: conversation.members
  };
  const closedConnections = await chatSender.sendAll(connectionsToSend, message, domainName, stage);
  var closedUserIds = [];
  for(let connId of closedConnections){
    const readParams = {
      TableName: process.env.connectionChatTableName,
      IndexName: process.env.connectionIdIndex,
      KeyConditionExpression: '#cd = :connId',
      ExpressionAttributeNames: {
        "#cd" : "connectionId"
      },
      ExpressionAttributeValues: {
        ':connId': connId
      }
    };
    const res = await dynamoDb.query(readParams);
    if(!res.Items){
      throw new Error("No record found in connection table for connectionId " + connId);
    }
    const connRecord = res.Items[0];
    closedUserIds.push(connRecord.userId);
  }
  console.log(closedUserIds);
  await updateMessagesInConversationChatTable(message, chatId, closedUserIds);
});

async function updateMessagesInConversationChatTable(message, chatId, isNew){
  const messageToSave = {
    text: message.text,
    createdAt: message.createdAt,
    senderId: message.senderId
  };
  const updateParams = {
      TableName: process.env.conversationChatTableName,
      Key: {
          chatId : chatId
      },
      UpdateExpression: "SET #ms = list_append(#ms, :vals), #in = :isNew",
      ExpressionAttributeValues: {
          ":vals": [messageToSave],
          ":isNew" : isNew
      },
      ExpressionAttributeNames: {
        "#ms" : "messages",
        "#in" : "isNew"
      },
      ReturnValues: 'ALL_NEW'
  };
  await dynamoDb.update(updateParams);
  return;
}
