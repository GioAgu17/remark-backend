import handler from "../../libs/handler-lib";
import * as scanUsers from "./libs/scanUserIds-lib";
import * as findUserOffers from "./libs/findUserOffers-lib";
import * as filterOffers from "./libs/filterExpiredOffers-lib";
import * as insertExpOffers from "./libs/insertExpiredOffers-lib";
import * as deleteOffers from "./libs/deleteExpiredOffers-lib";
export const main = handler(async (event, context) => {
  const users = await scanUsers.scanUserIds();
  if(!users.Items){
    throw new Error("Scan operation did not return any item");
  }
  for(let user of users.Items){
    const userOffers = await findUserOffers.findUserOffers(user);
    if(!userOffers.Items || typeof userOffers === "undefined" || userOffers.Items.length === 0){
      console.log("Offers not found for user " + user.userId);
    }else{
      const userExpiredOffers = filterOffers.filterExpiredOffers(userOffers.Items);
      if(typeof userExpiredOffers === "undefined"){
        console.log("No expired offers found for user id " + user.userId);
      }else{
        console.log(userExpiredOffers);
        const inserted = await insertExpOffers.insertExpiredOffers(userExpiredOffers);
        if(inserted)
          await deleteOffers.deleteExpiredOffers(userExpiredOffers);
      }
    }
  }
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);
});
