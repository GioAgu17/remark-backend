import handler from "../../libs/handler-lib";
import * as chatSender from "../../libs/chatSender-lib";
import * as connectionHelper from "./libs/userConnection-lib";

export const main = handler(async (event, context) => {
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUp - Lambda is warm!');
    return 'Lambda is warm!';
  }
  const payload = JSON.parse(event.body);
  if(!payload || !payload.userId)
    throw new Error("Can't proceed without userId");
  const connectionId = event.requestContext.connectionId;
  if(!connectionId || typeof connectionId === 'undefined'){
    throw new Error("Cannot proceed without connectionId");
  }
  const connectionAndChats = await connectionHelper.handleUserConnection(payload.userId, connectionId);
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const connection = connectionAndChats.connection;
  var allMessages = [];
  if(typeof connection.chatIds === 'undefined' || !connection.chatIds){
    console.log("No chats available for the connection: " + connectionId);
  }else{
    const chats = connectionAndChats.chats;
    for(let chat of chats){
      var message = {
        chatId : chat.chatId,
        messages: chat.messages,
        members : chat.members,
        isNew: chat.isNew,
        collaborationStatus : chat.collaborationStatus,
        offerDetails: (typeof chat.offerDetails === 'undefined') ? {} : chat.offerDetails
      };
      allMessages = allMessages.concat(message);
    }
  }
  await chatSender.sendAll([connectionId], allMessages, domainName, stage);
  return;
});
