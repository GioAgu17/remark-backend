import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as chatSender from "../../libs/chatSender-lib";
import * as connectionHelper from "./libs/userConnection-lib";
import * as convTableHelper from "../../libs/convTableHelper-lib";

export const main = handler(async (event, context) => {
  const payload = JSON.parse(event.body);
  if(!payload || !payload.userId)
    throw new Error("Can't proceed without userId");
  const connectionId = event.requestContext.connectionId;
  await connectionHelper.handleUserConnection(payload.userId, connectionId);
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
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
  if(typeof connection.chatIds === 'undefined' || !connection.chatIds){
    console.log("No chats available for the connection: " + connectionId);
  }else{
    const chatIds = connection.chatIds;
    for(let chatId of chatIds){
      const conversationChatItem = await convTableHelper.readFromConvTable(process.env.conversationChatTableName, chatId);
      var message = {
        chatId : chatId,
        messages: conversationChatItem.messages,
        members : conversationChatItem.members,
        isNew: conversationChatItem.isNew,
        collaborationStatus : conversationChatItem.collaborationStatus,
        offerDetails: (typeof conversationChatItem.offerDetails === 'undefined') ? {} : conversationChatItem.offerDetails
      };
      allMessages = allMessages.concat(message);
    }
  }
  await chatSender.sendAll([connectionId], allMessages, domainName, stage);
  return;
});
