import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
export const main = handler(async (event, context) => {
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
  const chatIds = connection.chatIds;
  var allMessages = [];
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
    message.offerId = conversationChatItem.offerId;
    message.messages = conversationChatItem.messages;
    message.members = conversationChatItem.members;
    allMessages = allMessages.concat(message);
  }
  return allMessages;
});
