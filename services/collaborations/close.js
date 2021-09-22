import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as chatSender from "../../libs/chatSender-lib";
import * as consts from "./constants.js";
import * as stats from "../statistics/api.js";

export const main = handler(async (event, context) => {
    const stage = process.env.stage;
    const domainName = process.env.websocketApiId;
    const data = JSON.parse(event.body);
    if(!data){
        throw new Error("Not getting data to close collaboration");
    }
    const businessId = data.businessId;
    const influencerId = data.remarkerId || data.influencerId;
    var userIds = [];
    userIds.push(businessId);
    userIds.push(influencerId);
    const offerId = data.offerId;
    // console.log(influencerId);
    let collab = null;
    if(!data.details){
        // we should reuse get.js
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
        collab = result.Item;
    }else
        collab = data;

    if(!collab.details)
        throw new Error("Collaboration does not have details!");

    const details = collab.details;
    const accountIG = data.accountIG || details.remarkerUsername;
    const tags = data.tags || [details.offerDetails.businessName, consts.remarkIGAccountName];

    const requestBody = { 'body' : {
            accountIG: accountIG,
            tags: tags
        }
    };
    const collabStatsJS = await stats.collabStatistics(requestBody);
    const collabStats = JSON.parse(collabStatsJS.body);

    // If there aren't matching tags to close the collaboration, return.
    if(collabStats === false){
        console.log('No match in account: '+ accountIG +' for tags: ['+ tags.toString() +']');
        return false;
    }

    details.images = collabStats.images;
    details.hashtags = collabStats.hashtags;
    details.comments = collabStats.comments;
    details.likes = collabStats.likes;
    details.impactScore = Math.random() * (95 - 77) + 77;
    details.caption = collabStats.caption;
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
    if(!res.Responses)
        throw new Error("Didn't find connection information for userIds " + userIds);
    const connections = res.Responses[process.env.connectionChatTableName];
    const connIds = [];
    for(let connection of connections){
        connIds.push(connection.connectionId);
        const chatIds = connection.chatIds;
        const index = chatIds.indexOf(chatId);
        if(index != -1){
            const updateParams = {
                TableName: process.env.connectionChatTableName,
                Key: {
                    userId : connection.userId
                },
                UpdateExpression: "REMOVE chatIds[" + index + "]"
            };
            await dynamoDb.update(updateParams);
        }
    }
    //send delete message to frontend
    const delMessage = {
        chatId: chatId,
        action: "delete"
    };
    await chatSender.sendAll(connIds, delMessage, domainName, stage);
    return { status: true };
});