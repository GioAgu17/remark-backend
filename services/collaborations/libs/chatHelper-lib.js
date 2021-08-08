import dynamoDb from "../../../libs/dynamodb-lib";
import * as uuid from "uuid";
import * as chatSender from "../../../libs/chatSender-lib";
export async function newChat(userIds, businessId, members, rangeKey){
  const stage = process.env.stage;
  const domainName = process.env.websocketApiId;
  var connections = [];
  const introMessage = "Welcome to the chat of the collaboration! Here you can discuss on everything you may want to ask, and especially schedule your meeting!"
  const chatId = uuid.v1();
  const businessMessage = {
    chatId: chatId,
    text: introMessage,
    members: members,
    senderId: "remark",
    createdAt: new Date().toISOString()
  };
  const remarkerMessage = {
    chatId: chatId,
    members: members,
    text: introMessage,
    senderId: "remark",
    createdAt: new Date().toISOString()
  };
  const messageToSave = {
    text: introMessage,
    createdAt: new Date().toISOString(),
    senderId: "remark"
  }
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
  }
  // write to all remarkers
  await chatSender.sendAll(connections, remarkerMessage, domainName, stage);
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
  // send message to business
  await chatSender.send(bizConnectionId, businessMessage, domainName, stage);
  // insert new record inside conversationChatTable
  var messages = [];
  messages.push(messageToSave);
  const insertParams = {
    TableName: process.env.conversationChatTableName,
    Item: {
      chatId: chatId,
      connections: connections,
      messages: messages,
      members: members,
      offerRangeKey : rangeKey,
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