import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as consts from "./constants.js";
import * as chatSender from "../../libs/chatSender-lib";
export const main = handler(async (event, context) => {
  const body = JSON.parse(event.body);
  const remarkerId = body.remarkerId;
  if(!remarkerId)
    throw new Error("RemarkerId not present in request");
  const offerId = body.offerId;
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
  const messageToSave = {
    text: "Il business ha appena confermato che il vostro incontro é andato a buon fine, ora manca solo la pubblicazione su Instagram!",
    createdAt: new Date().toISOString(),
    senderId: "remark"
  };
  var messageToSend = messageToSave;
  messageToSend.action = "confirm";
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
  const closedConnections = await chatSender.sendAll(connectionIds, messageToSend, domainName, stage);
  console.log(closedConnections);
  const userIdsNotRead = closedConnections.map( connId => connectionsAndUsers.get(connId));
  console.log(userIdsNotRead);
  const updateParams = {
    TableName: process.env.conversationChatTableName,
    Key: {
        chatId : chatId
    },
    UpdateExpression: "SET #ms = list_append(#ms, :vals), #in = :isNew",
    ExpressionAttributeValues: {
        ":vals": [messageToSave],
        ":isNew" : userIdsNotRead
    },
    ExpressionAttributeNames: {
      "#ms" : "messages",
      "#in" : "isNew"
    },
  };
  await dynamoDb.update(updateParams);
  return { status: true };
});
