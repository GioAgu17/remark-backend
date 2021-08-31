import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as convTableHelper from "../../libs/convTableHelper-lib";
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
  const conversation = await convTableHelper.readFromConvTable(process.env.conversationChatTableName, payload.chatId);
  if(!conversation.members)
    throw new Error("Cannot send message to chat as there are no members in chat " + payload.chatId);
  // send messages to all connections but the one sending this message
  var connectionsToSend = conversation.connections;
  const indexConnection = connectionsToSend.indexOf(connectionId);
  connectionsToSend.splice(indexConnection, 1);
  const message = {
    chatId: payload.chatId,
    text: payload.text,
    senderId: payload.senderId,
    createdAt: payload.createdAt,
    members: conversation.members,
    collaborationStatus: conversation.collaborationStatus
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
  await updateMessagesInConversationChatTable(message, conversation, userIds);
});


async function updateMessagesInConversationChatTable(message, conversationRecord, userIds){
  const isNewArray = conversationRecord.isNew;
  // users who are part of the chat that have at least one unread message
  const isNewArrayExistingUsers = isNewArray.filter( u => userIds.includes(u.userId));
  const isNewArrayExistingUsersIds = isNewArrayExistingUsers.map(u => u.userId);
  // increment the number of unread messages by 1 for existing users
  await incrementUnreadMessages(isNewArrayExistingUsersIds, conversationRecord.chatId, isNewArray);

  // users who are part of the chat that don't have unread messages
  const isNewArrayNewUsersIds = userIds.filter(clId => !isNewArrayExistingUsersIds.includes(clId));
  const isNewArrayNewUsers = isNewArrayNewUsersIds.map(id => ({userId : id, unread : 1}));

  // update the record with the new users and the message being sent with this API call
  const messageToSave = {
    text: message.text,
    createdAt: message.createdAt,
    senderId: message.senderId
  };
  const updateMessageAndNewParams = {
      TableName: process.env.conversationChatTableName,
      Key: {
          chatId : conversationRecord.chatId
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

async function incrementUnreadMessages(existingUserIds, chatId, isNewArray){
  var indexes = [];
  for(let existingUserId of existingUserIds){
    const index = isNewArray.map(e => e.userId).indexOf(existingUserId);
    if(index != -1)
      indexes.push(index);
  }
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
}
