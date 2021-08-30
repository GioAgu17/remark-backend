import dynamoDb from "../../../libs/dynamodb-lib";
import convTableHelper from "../../../libs/convTableHelper-lib";
import * as arrayHelper from "../../../libs/arrayHelper-lib";

export async function handleUserConnection(userId, connectionId){
    const readParams = {
        TableName: process.env.connectionChatTableName,
        Key: {
          userId: userId
        }
      };
      const result = await dynamoDb.get(readParams);
      if(!result.Item || result.Item === "undefined")
        await createConnection(userId, connectionId);
      else{
        await updateConnectionTable(userId, connectionId);
        await updateConversationTable(connectionId, result.Item.connectionId, result.Item.chatIds);
      }
      return;
}

async function createConnection(userId, connectionId){
    console.log("creating new entry for userId " + userId);
    const insertParams = {
      TableName: process.env.connectionChatTableName,
      Item:{
        userId: userId,
        connectionId: connectionId,
        chatIds: [],
        createdAt: new Date().toISOString(),
      }
    };
    await dynamoDb.put(insertParams);
    return;
}

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
    await dynamoDb.update(updateParams);
    return;
}

async function updateConversationTable(newConnectionId, oldConnectionId, chatIds){
    for(let chatId of chatIds){
        const conversationChatRecord = convTableHelper.readFromConvTable(process.env.conversationChatTableName, chatId);
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
          },
          ReturnValues: 'ALL_NEW'
        };
        await dynamoDb.update(updateConnectionParams);
      }
      return;
}