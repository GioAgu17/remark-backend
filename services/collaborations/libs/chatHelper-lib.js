import dynamoDb from "../../../libs/dynamodb-lib";
import * as uuid from "uuid";
import * as chatSender from "../../../libs/chatSender-lib";
export async function newChat(userIds, businessId, members, offerId){
  const stage = process.env.stage;
  const domainName = process.env.websocketApiId;
  var connections = [];
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
  }
  // write to all remarkers
  try{
    await chatSender.sendAll(connections, remarkerMessage, domainName, stage);
  }catch(e){
    if (e.statusCode === 410) {
      console.log("Got the error " + e);
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
  // send message to business
  await chatSender.send(bizConnectionId, businessMessage, domainName, stage);
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
