import dynamoDb from "../../../libs/dynamodb-lib";
import * as convTableHelper from "../../../libs/convTableHelper-lib";
import * as arrayHelper from "../../../libs/arrayHelper-lib";

export async function handleUserConnection(userId, connectionId){
  var connectionRecord = {};
  var conversationRecords = [];
  const readParams = {
      TableName: process.env.connectionChatTableName,
      Key: {
        userId: userId
      }
  };
  const result = await dynamoDb.get(readParams);
  if(!result.Item || typeof result.Item === 'undefined')
    connectionRecord = await createConnection(userId, connectionId);
  else{
    connectionRecord = await updateConnectionTable(userId, connectionId);
    conversationRecords = await updateConversationTable(connectionId, result.Item.connectionId, result.Item.chatIds);
  }
  return {
    connection: connectionRecord,
    chats: conversationRecords
  };
}

// creates mapping between connectionId and userId
// when user logs into the app for the first time
async function createConnection(userId, connectionId){
  console.log("creating new entry for userId " + userId);
  const insertParams = {
    TableName: process.env.connectionChatTableName,
    Item:{
      userId: userId,
      connectionId: connectionId,
      chatIds: [],
      createdAt: new Date().toISOString(),
    },
    ReturnValues: 'NONE'
  };
  await dynamoDb.put(insertParams);
  const readParams = {
    TableName: process.env.connectionChatTableName,
    Key : {
      userId: userId
    }
  };
  const res = await dynamoDb.get(readParams);
  if(!res.Item || (typeof res.Item === "undefined"))
    throw new Error("Cannot read newly inserted connection record with userId " + userId);
  else
    return res.Item;
}

// updates the mapping
async function updateConnectionTable(userId, connectionId){
    console.log("updating connectionId for userId " + userId);
    const updateParams = {
        TableName: process.env.connectionChatTableName,
        Key: {
            userId : userId
        },
        UpdateExpression: "SET #connectionId = :val",
        ExpressionAttributeValues: {
            ":val": connectionId
        },
        ExpressionAttributeNames: {
          "#connectionId" : "connectionId"
        },
        ReturnValues: 'ALL_NEW'
    };
    const result = await dynamoDb.update(updateParams);
    return result.Attributes;
}

// updates the conversationChat table with the new connectionId
// for every chat where the user belongs
async function updateConversationTable(newConnectionId, oldConnectionId, chatIds){
  const chats = [];
  for(let chatId of chatIds){
    const conversationChatRecord = await convTableHelper.readFromConvTable(process.env.conversationChatTableName, chatId);
    // removing old connection id and adding the new one
    const connections = conversationChatRecord.connections;
    arrayHelper.remove(connections, oldConnectionId);
    connections.push(newConnectionId);
    // adding updated connections
    const updateConnectionParams = {
      TableName: process.env.conversationChatTableName,
      Key: {
        chatId: chatId
      },
      UpdateExpression: "SET #cn = :vals",
      ExpressionAttributeValues: {
          ":vals": connections
      },
      ExpressionAttributeNames: {
        "#cn" : "connections"
      }
    };
    await dynamoDb.update(updateConnectionParams);
    chats.push(conversationChatRecord);
  }
  return chats;
}
