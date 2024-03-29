import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as consts from "./constants.js";
import * as chatSender from "../../libs/chatSender-lib";
import * as convTableHelper from "../../libs/convTableHelper-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const remarkerId = data.remarkerId;
  if(!remarkerId)
    throw new Error("RemarkerId not present in request");
  const offerId = data.offerId;
  if(!offerId)
    throw new Error("OfferId not present in request");
  const statusToUpdate = consts.statuses.POSTING;
  const readCollabParams = {
      TableName: process.env.collaborationTableName,
      Key: {
          influencerId : remarkerId,
          offerId: offerId
      }
  };
  const result = await dynamoDb.get(readCollabParams);
  if(!result.Item){
    throw new Error("Collaboration not found with remarker " + remarkerId + " and offerId" + offerId);
  }
  const chatId = result.Item.details.chatId;
  const updateCollabParams = {
    TableName: process.env.collaborationTableName,
    Key: {
      influencerId: remarkerId,
      offerId: offerId
    },
    UpdateExpression : "SET #st = :statusAttribute",
    ExpressionAttributeValues: {
      ":statusAttribute": statusToUpdate
    },
    ExpressionAttributeNames: {
      "#st" : "status"
    }
  };
  await dynamoDb.update(updateCollabParams);
  // sending message to both businesses and remarker
  var text = "";
  if(typeof data.lang !== "undefined"){
    if(data.lang === "EN")
      text = consts.confirmMessage.EN;
    else if(data.lang === "IT")
      text = consts.confirmMessage.IT;
    else
      text = consts.confirmMessage.IT;
  }else
    text = consts.confirmMessage.IT;
  const messageToSave = {
    text: text,
    createdAt: new Date().toISOString(),
    senderId: "remark"
  };
  var messageToSend = messageToSave;
  messageToSend.action = "confirm";
  messageToSend.chatId = chatId;
  messageToSend.collaborationStatus = statusToUpdate;
  const conversation = await convTableHelper.readFromConvTable(process.env.conversationChatTableName, chatId);
  const members = conversation.members;
  messageToSend.members = members;

  const users = [];
  users.push(remarkerId);
  users.push(event.requestContext.identity.cognitoIdentityId);
  var connectionsAndUsers = new Map();
  for(let userId of users){
    const readParams = {
      TableName: process.env.connectionChatTableName,
      Key: {
        userId: userId
      }
    };
    const res = await dynamoDb.get(readParams);
    if(!res.Item)
      throw new Error("No results found with userId " + userId);
      connectionsAndUsers.set(res.Item.connectionId, userId);
  }
  const stage = process.env.stage;
  const domainName = process.env.websocketApiId;
  const connectionIds = Array.from(connectionsAndUsers.keys());
  await chatSender.sendAll(connectionIds, messageToSend, domainName, stage);
  const userIdsNotRead = connectionIds.map( connId => connectionsAndUsers.get(connId));
  const isNewArray = conversation.isNew;
  const isNewArrayExistingUsers = isNewArray.filter( u => userIdsNotRead.includes(u.userId));
  const isNewArrayExistingUsersIds = isNewArrayExistingUsers.map(u => u.userId);
  const isNewArrayNewUsersIds = userIdsNotRead.filter(clId => !isNewArrayExistingUsersIds.includes(clId));
  const isNewArrayNewUsers = isNewArrayNewUsersIds.map(id => ({userId : id, unread : 1}));
  var indexes = [];
  for(let existingUserId of isNewArrayExistingUsersIds){
    const index = isNewArray.map(e => e.userId).indexOf(existingUserId);
    if(index != -1)
      indexes.push(index);
  }
  console.log(indexes);
  for(let index of indexes){
    const updateExistingParams = {
      TableName: process.env.conversationChatTableName,
      Key: {
          chatId : chatId
      },
      UpdateExpression: "SET isNew["+index+"].#ur = isNew["+index+"].#ur + :val",
      ExpressionAttributeValues: {
        ":val": 1
      },
      ExpressionAttributeNames: {
        "#ur" : "unread"
      }
    };
    await dynamoDb.update(updateExistingParams);
  }
  const updateParams = {
    TableName: process.env.conversationChatTableName,
    Key: {
        chatId : chatId
    },
    UpdateExpression: "SET #ms = list_append(#ms, :vals), #in = :isNew, #cs = :status",
    ExpressionAttributeValues: {
        ":vals": [messageToSave],
        ":isNew" : isNewArrayNewUsers,
        ":status" : statusToUpdate
    },
    ExpressionAttributeNames: {
      "#ms" : "messages",
      "#in" : "isNew",
      "#cs" : "collaborationStatus"
    },
  };
  await dynamoDb.update(updateParams);
  return { status: true };
});
