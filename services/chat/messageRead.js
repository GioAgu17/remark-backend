import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
export const main = handler(async (event, context) => {
  const payload = JSON.parse(event.body);
  if(!payload.userId)
    throw new Error("Cannot proceed without userId");
  if(!payload.chatId)
    throw new Error("Cannot proceed without chatId");
  const readParams = {
      TableName: process.env.conversationChatTableName,
      Key: {
          chatId: payload.chatId
      }
  };
  const res = await dynamoDb.get(readParams);
  if(!res.Item)
    throw new Error("No entry found in conversation chat table for chat " + payload.chatId);
  const isNew = res.Item.isNew;
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
