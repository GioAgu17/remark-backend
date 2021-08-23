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
  await chatSender.sendAll(connectionsToSend, message, domainName, stage);
  var userIds = [];
  for(let connId of connectionsToSend){
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
    userIds.push(connRecord.userId);
  }
  await updateMessagesInConversationChatTable(message, chatId, userIds);
});

async function updateMessagesInConversationChatTable(message, chatId, userIds){
  const messageToSave = {
    text: message.text,
    createdAt: message.createdAt,
    senderId: message.senderId
  };
  const readParams = {
    TableName: process.env.conversationChatTableName,
    Key: {
      chatId: chatId
    }
  };
  const res = await dynamoDb.get(readParams);
  if(!res.Item){
    throw new Error("Record not found in conversation table with chat " + chatId);
  }
  const isNewArray = res.Item.isNew;
  console.log(isNewArray);
  const isNewArrayExistingUsers = isNewArray.filter( u => userIds.includes(u.userId));
  console.log(isNewArrayExistingUsers);
  const isNewArrayExistingUsersIds = isNewArrayExistingUsers.map(u => u.userId);
  console.log(isNewArrayExistingUsersIds);
  const isNewArrayNewUsersIds = userIds.filter(clId => !isNewArrayExistingUsersIds.includes(clId));
  console.log(isNewArrayNewUsersIds);
  const isNewArrayNewUsers = isNewArrayNewUsersIds.map(id => ({userId : id, unread : 1}));
  console.log(isNewArrayNewUsers);
  var indexes = [];
  for(let existingUserId of isNewArrayExistingUsersIds){
    const index = isNewArray.map(e => e.userId).indexOf(existingUserId);
    if(index != -1)
      indexes.push(index);
  }
  console.log(indexes);
  for(let index of indexes){
    const updateExistingParams = {
      TableName: process.env.conversationChatTableName,
      Key: {
          chatId : chatId
      },
      UpdateExpression: "SET isNew["+index+"].#ur = isNew["+index+"].#ur + :val",
      ExpressionAttributeValues: {
        ":val": 1
      },
      ExpressionAttributeNames: {
        "#ur" : "unread"
      }
    };
    await dynamoDb.update(updateExistingParams);
  }
  const updateMessageAndNewParams = {
      TableName: process.env.conversationChatTableName,
      Key: {
          chatId : chatId
      },
      UpdateExpression: "SET #ms = list_append(#ms, :vals), #in = list_append(#in, :isNew)",
      ExpressionAttributeValues: {
          ":vals": [messageToSave],
          ":isNew" : isNewArrayNewUsers
      },
      ExpressionAttributeNames: {
        "#ms" : "messages",
        "#in" : "isNew"
      },
  };
  await dynamoDb.update(updateMessageAndNewParams);
  return;
}
