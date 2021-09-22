import handler from "../../libs/handler-lib";
// import dynamoDb from "../../libs/dynamodb-lib";
import * as collabs from "./libs/scanCollabs-lib";
import * as closeCollab from "../collaborations/close.js";
// import * as stats from "../statistics/api.js";

export const main = handler(async (event, context) => {
    const collaborations = await collabs.scanCollabs();
    // console.log(collaborations);
    Object.keys(collaborations.Items).forEach(async function(key) {
        const collab = collaborations.Items[key];
        closeCollab.main( {'body':JSON.stringify(collab)} );
    });
});
