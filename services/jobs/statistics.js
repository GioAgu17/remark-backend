import handler from "../../libs/handler-lib";
import * as scanUsers from "./libs/scanUserIds-lib";
import * as findUserOffers from "./libs/findUserOffers-lib";
export const main = handler(async (event, context) => {
  const users = await scanUsers.scanUserIds();
  if(!users.Items){
    throw new Error("Scan operation did not return any item");
  }
  for(let user of users.Items){
    console.log(user.userId);
    const userOffers = await findUserOffers.findUserOffers(user);
    if(!userOffers.Items){
      console.log("There are no offers available for user "+ user.userId);
    }else{
      console.log("User "+user.userId+" has "+userOffers.Items.length+ " offers");
    }
  }
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);
});
