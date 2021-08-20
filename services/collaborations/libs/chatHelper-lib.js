import dynamoDb from "../../../libs/dynamodb-lib";
import * as chatSender from "../../../libs/chatSender-lib";
export async function newChat(userIds, businessId, members, offerDetails, offerId, chatId){
  const stage = process.env.stage;
  const domainName = process.env.websocketApiId;
  const introMessage = "Welcome to the chat of the collaboration! Here you can discuss on everything you may want to ask, and especially schedule your meeting!";
  const messageToSend = {
    chatId: chatId,
    text: introMessage,
    offerDetails: offerDetails,
    members: members,
    senderId: "remark",
    createdAt: new Date().toISOString()
  };
  const messageToSave = {
    text: introMessage,
    createdAt: new Date().toISOString(),
    senderId: "remark"
  };
  userIds.push(businessId);
  var connectionsAndUsers = new Map();
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
    connectionsAndUsers.set(connectionId, userId);
    await updateConnectionChatTable(userId, chatId);
  }
  const connectionIds = Array.from( connectionsAndUsers.keys());
  // write to all participants in the chat
  const closedConnections = await chatSender.sendAll(connectionIds, messageToSend, domainName, stage);
  // insert new record inside conversationChatTable
  var userIdsNotRead = [];
  for(let connId of closedConnections){
    const obj = {};
    obj.userId = connectionsAndUsers.get(connId);
    obj.unread = 1;
    userIdsNotRead.push(obj);
  }
  var messages = [];
  messages.push(messageToSave);
  const insertParams = {
    TableName: process.env.conversationChatTableName,
    Item: {
      chatId: chatId,
      connections: connectionIds,
      messages: messages,
      isNew: userIdsNotRead,
      members: members,
      offerDetails : offerDetails,
      offerId: offerId,
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