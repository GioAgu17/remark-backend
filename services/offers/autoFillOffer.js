import handler from "../../libs/handler-lib";
const map = require('./resources/autoFillMap');
export const main = handler(async (event, context) => {
  const body = JSON.parse(event.body);
  const offerValue = body.offerValue;
  var suggestions = [];
  if(offerValue <50){
    suggestions = map.firstTier;
  }else if(offerValue > 50 && offerValue < 100){
    suggestions = map.secondTier;
  }else if(offerValue > 100 && offerValue < 200){
    suggestions = map.thirdTier;
  }
  // and so on....
  return suggestions;
});
