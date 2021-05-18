import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import AWS from "aws-sdk";
export const main = handler(async (event, context) => {
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const connectionId = event.requestContext.connectionId;
  const agma = new AWS.ApiGatewayManagementApi({
    endpoint: domainName + '/' + stage
  });
  console.log("Process message ", connectionId, event.body);

  const message = JSON.parse(event.body);
  message.timestamp = Date.now();
  const choice = message.choice;
  delete message.choice;

  switch(choice){
    case "message":
      /*await analyzeMessage(message);
      if(message.reject){
        await rejectMessage(agma, connectionId, message);
      }else{
        await sendMessageToRoom(agma, connectionId, message);
      }*/
      await sendMessageToRoom(agma, connectionId, message);
      break;
    case "init":
      await initConnection(connectionId, message.room, message.lang);
      await sendRoomMessages(agma, connectionId, message.room, message.lang);
      break;
    default:
      return failedResponse(message);
  }
  return successfulResponse;
});

const successfulResponse = {
  statusCode: 200
};
function failedResponse(message){
  return {
    statusCode: 500,
    body: JSON.stringify({msg : "Unknown action, failed to process message: " + message})
  };
};

async function initConnection(connectionId, room, lang) {
    console.log('initConnection', connectionId, room, lang);
    await dynamoDb.put({
        TableName: process.env.CHATCONNECTION_TABLE,
        Item: {
            connectionId: connectionId,
            lang: lang,
            room: room
        }
    });
}

async function sendRoomMessages(agma, connectionId, room, destLang) {
    console.log('sendRoomMessages', connectionId, room, destLang);
    const conversationsData = await dynamoDb.query({
        TableName: process.env.CONVERSATIONS_TABLE,
        KeyConditionExpression: 'room = :room',
        ExpressionAttributeValues: {
            ':room': room
        }
    });
    const messages = [];
    for (const message of conversationsData.Items) {
        messages.push(message);
    }
    await sendMessagesToConnection(agma, connectionId, messages);
}

async function sendMessageToRoom(agma, sourceConnectionId, message) {
    console.log('sendMessageToRoom', sourceConnectionId, message);

    // get room from connectionId

    const connectionData = await dynamoDb.get({
        TableName: process.env.CHATCONNECTION_TABLE,
        Key: {
            connectionId: sourceConnectionId
        }
    });

    if (!('room' in connectionData.Item)) {
        return;
    }

    message.room = connectionData.Item.room;

    await storeMessage(message);

    // get all connections from room
    const connectionsData = await dynamoDb.query({
        TableName: process.env.CHATCONNECTION_TABLE,
        IndexName: 'roomIndex',
        KeyConditionExpression: 'room = :room',
        ExpressionAttributeValues: {
            ':room': message.room
        }
    });

    await Promise.all(
        connectionsData.Items.map(async({ connectionId, lang }) => {
            await sendMessagesToConnection(agma, connectionId, [message]);
        })
    );
}

/*async function analyzeMessage(message) {
  // for future reference on how to filter bad messages: https://github.com/danilop/serverless-positive-chat
}*/

async function sendMessagesToConnection(agma, connectionId, messages) {
    console.log('sendMessagesToConnection', connectionId, messages);
    try {
        await agma.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(messages)
        }).promise();
    }
    catch (err) {
        if (err.statusCode === 410) {
            await deleteConnection(connectionId);
        }
        else {
            throw err;
        }
    }
}

async function storeMessage(message) {
    console.log('storeMessage', message);
    await dynamoDb.put({
        TableName: process.env.CONVERSATIONS_TABLE,
        Item: message
    });
};

const deleteConnection = connectionId => {
  const deleteParams = {
    TableName: process.env.CHATCONNECTION_TABLE,
    Key: {
      connectionId: connectionId
    }
  };
  return dynamoDb.delete(deleteParams);
};
