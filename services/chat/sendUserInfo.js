import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as arrayHelper from "../../libs/arrayHelper-lib";
export const main = handler(async (event, context) => {
  const message = JSON.parse(event.body);
  if(!message || !message.userId)
    throw new Error("Can't proceed without userId");
  const connectionId = event.requestContext.connectionId;
  const userId = message.userId;
  const readParams = {
    TableName: process.env.connectionChatTableName,
    Key: {
      userId: userId
    }
  };
  const result = await dynamoDb.get(readParams);
  // if userId has no entries, create a new connection
  if(!result.Item){
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
  // otherwise, update connection with new connectionId and then update also conversationTable
  // with new connection, for all chats of the user
  }else{
    const connectionIdOld = result.Item.connectionId;
    const chatIds = result.Item.chatIds;
    console.log("updating connectionId for userId " + userId);
    const updateParams = {
        TableName: process.env.connectionChatTableName,
        Key: {
            userId : userId
        },
        UpdateExpression: "SET #connectionId = :vals",
        ExpressionAttributeValues: {
            ":vals": connectionId
        },
        ExpressionAttributeNames: {
          "#connectionId" : "connectionId"
        },
        ReturnValues: 'ALL_NEW'
    };
    await dynamoDb.update(updateParams);
    // for each chatId, update new connectionId
    for(let chatID of chatIds){
      const readParams = {
        TableName: process.env.conversationChatTableName,
        Key: {
          chatId: chatID
        }
      };
      const result = await dynamoDb.get(readParams);
      if(!result.Item){
        throw new Error("Did not find any result in conversationChatTable for chatId " + chatID);
      }
      // removing old connection id and adding the new one
      const connections = result.Item.connections;
      arrayHelper.remove(connections, connectionIdOld);
      connections.push(connectionId);

      // adding updated connections
      const updateConnectionParams = {
        TableName: process.env.conversationChatTableName,
        Key: {
          chatId: chatID
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
  }
});
