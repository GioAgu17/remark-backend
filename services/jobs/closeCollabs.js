import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import * as collabs from "./libs/scanCollabs-lib";
import * as stats from "../statistics/api.js";

export const main = handler(async (event, context) => {
    const collaborations = await collabs.scanCollabs();
    Object.keys(collaborations.Items).forEach(async function(key) {
        const collab = collaborations.Items[key];
        const poster = collab.details.remarkerUsername;
        const tagged = collab.details.offerDetails.businessName;
        // console.log(poster, tagged, collab.influencerId, collab.offerId);
        const fakEvt = { 'body' : '{"poster" : "'+poster+'", "tagged" : "'+tagged+'"}' };
        const hasBeenTagged = await stats.hasBeenTagged(fakEvt);
        // console.log(hasBeenTagged);
        if(hasBeenTagged){
            // update
            const updateParams = {
                TableName: process.env.collaborationTableName,
                Key: {
                    influencerId : collab.influencerId,
                    offerId: collab.offerId
                },
                UpdateExpression: "SET #st = :statusAttr",
                ExpressionAttributeValues: {
                    ":statusAttr": collabs.statuses.POSTED,
                },
                ExpressionAttributeNames: {
                    "#st" : "status",
                }
            };
            await dynamoDb.update(updateParams);
        }
        // process.exit();
    });
});