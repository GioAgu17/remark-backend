import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as convTableHelper from "../../libs/convTableHelper-lib";

export const main = handler(async (event, context) => {
  const payload = JSON.parse(event.body);
  if(!payload.userId)
    throw new Error("Cannot proceed without userId");
  if(!payload.chatId)
    throw new Error("Cannot proceed without chatId");
  const conversationRecord = await convTableHelper.readFromConvTable(process.env.conversationChatTableName, payload.chatId);
  const isNew = conversationRecord.isNew;
  var index = isNew.map(e => e.userId).indexOf(payload.userId);
  if(index != -1){
    const updateParams = {
        TableName: process.env.conversationChatTableName,
        Key: {
            chatId : payload.chatId
        },
        UpdateExpression: "REMOVE isNew[" + index + "]"
      };
      await dynamoDb.update(updateParams);
  }else
    console.log("User " + payload.userId + " not found in isNew for chat " + payload.chatId);
  return;
});
