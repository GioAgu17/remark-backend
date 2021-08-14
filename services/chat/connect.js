import handler from "../../libs/handler-lib";
export const main = handler(async (event, context) => {
  const eventType = event.requestContext.eventType;
  if(eventType == "DISCONNECT"){
    return successfulResponse;
  }else if(eventType == "CONNECT"){
      return successfulResponse;
  }else{
    return failedResponse(eventType);
  }
});

const successfulResponse = {
  statusCode: 200
};

function failedResponse(eventType){
  return {
    statusCode: 500,
    body: JSON.stringify({msg : "Unknown event type " + eventType})
  };
};

export const defaultMessage = handler(async (event, context) => {
  return{
    statusCOde : 200,
    body: JSON.stringify({msg : "Default route"})
  };
});
