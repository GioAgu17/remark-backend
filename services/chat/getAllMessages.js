import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as chatSender from "../../libs/chatSender-lib";
export const main = handler(async (event, context) => {
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const connectionId = event.requestContext.connectionId;
  if(!connectionId){
    throw new Error("Cannot proceed without connectionId");
  }
  const readParams = {
    TableName: process.env.connectionChatTableName,
    IndexName: process.env.connectionIdIndex,
    KeyConditionExpression: 'connectionId = :conn_id',
    ExpressionAttributeValues: {
      ':conn_id': connectionId,
    }
  };
  const result = await dynamoDb.query(readParams);
  if(!result.Items){
    throw new Error("Didn't find any user with connectionId "+connectionId);
  }
  const connection = result.Items[0];
  var allMessages = [];
  if(!connection.chatIds){
    console.log("No chats available for the connection: " + connectionId);
  }else{
    const chatIds = connection.chatIds;
    for(let chatId of chatIds){
      const params = {
        TableName: process.env.conversationChatTableName,
        Key:{
          chatId: chatId
        }
      };
      const res = await dynamoDb.get(params);
      if(!res.Item){
        throw new Error("No entry for chatId "+chatId);
      }
      const conversationChatItem = res.Item;
      var message = {};
      message.chatId = chatId;
      message.offerRangeKey = conversationChatItem.rangeKey;
      message.messages = conversationChatItem.messages;
      message.members = conversationChatItem.members;
      allMessages = allMessages.concat(message);
    }
  }
  await chatSender.send(connectionId, allMessages, domainName, stage);
  return;
});
