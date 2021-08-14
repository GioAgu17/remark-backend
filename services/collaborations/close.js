import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as chatSender from "../../libs/chatSender-lib";
import * as consts from "./constants.js";
export const main = handler(async (event, context) => {
    const stage = process.env.stage;
    const domainName = process.env.websocketApiId;
    const data = JSON.parse(event.body);
    if(!data){
        throw new Error("Not getting data to close collaboration");
    }
    const businessId = data.businessId;
    const influencerId = data.remarkerId;
    var userIds = [];
    userIds.push(businessId);
    userIds.push(influencerId);
    const offerId = data.offerId;
    const readParams = {
        TableName: process.env.collaborationTableName,
        Key: {
            influencerId: influencerId,
            offerId: offerId
        }
    };
    const result = await dynamoDb.get(readParams);
    if(!result.Item){
        throw new Error("No collaboration found for influencerId: " + influencerId + " and offerId: " + offerId);
    }
    const collab = result.Item;
    if(!collab.details)
        throw new Error("Collaboration does not have details!");
    const details = collab.details;
    var images = [];
    images.push("collabPicTestResto.jpg");
    images.push("collabPicTest.jpg");
    var hashtags = [];
    hashtags.push("sunset");
    hashtags.push("together");
    details.images = images;
    details.hashtags = hashtags;
    details.comments = 23;
    details.likes = 1352;
    details.impactScore = 78;
    details.caption = "It was a great day here at @ostellobello! Thanks @remark for letting me discover this wonderful places!";
    const statusToUpdate = consts.statuses.POSTED;
    const updateParams = {
        TableName: process.env.collaborationTableName,
        Key: {
            influencerId : influencerId,
            offerId: offerId
        },
        UpdateExpression: "SET #st = :statusAttr, #dts = :details",
        ExpressionAttributeValues: {
            ":statusAttr": statusToUpdate,
            ":details" : details
        },
        ExpressionAttributeNames: {
        "#st" : "status",
        "#dts" : "details"
        },
        ReturnValues: 'ALL_NEW'
    };
    await dynamoDb.update(updateParams);
    // delete chats related to this collaboration
    const chatId = details.chatId;
    const deleteParams = {
        TableName: process.env.conversationChatTableName,
        Key: {
            chatId: chatId
        }
    };
    await dynamoDb.delete(deleteParams);
    // remove chatId from list of chatIds in connections table
    const batchReadParams = {
        RequestItems: {},
    };
    var keys = [];
    for(let userId of userIds){
        const obj = {
          userId : userId
        };
        keys.push(obj);
    }
    batchReadParams.RequestItems[process.env.connectionChatTableName] = {
        Keys: keys
    };
    const res = await dynamoDb.batchGet(batchReadParams);
    if(!res.Items)
        throw new Error("Didn't find connection information for userIds " + userIds);
    const connections = res.Items;
    const connIds = [];
    for(let connection of connections){
        connIds.push(connection.connectionId);
        const chatIds = connection.chatIds;
        const index = chatIds.indexOf(chatId);
        const updateParams = {
            TableName: process.env.connectionChatTableName,
            Key: {
                userId : connection.userId
            },
            UpdateExpression: "REMOVE #ci[:index]",
            ExpressionAttributeValues: {
                "ci": chatIds,
                ":index" : index
            },
            ExpressionAttributeNames: {
            "#ci" : "chatIds"
            }
        };
        await dynamoDb.update(updateParams);
    }
    //send delete message to frontend
    const delMessage = {
        chatId: chatId,
        action: "delete"
    };
    await chatSender.sendAll(connIds, delMessage, domainName, stage);
    return { status: true };
});