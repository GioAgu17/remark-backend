import dynamoDb from "./dynamodb-lib";
export async function readFromConvTable(conversationChatTableName, chatId){
    const readParams = {
        TableName: process.env.conversationChatTableName,
        Key: {
          chatId: chatId
        }
      };
      const result = await dynamoDb.get(readParams);
      if(!result.Item){
        throw new Error("Did not find any result in conversationChatTable for chatId " + chatId);
      }
      return result.Item;
}
