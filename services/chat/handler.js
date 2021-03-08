const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();
const REJECT_MESSAGE = "Perfavore, cerca di migliorare il tono di questo messaggio. Noi di Remark accettiamo solo messaggi positivi";

const successfullResponse = {
  statusCode: 200
};

module.exports.connectionManager = (event, context, callback) => {
    const eventType = event.requestContext.eventType;
    const connectionId = event.requestContext.connectionId;
    if(eventType == "DISCONNECT"){
      deleteConnection(connectionId);
      callback(null, successfullResponse);
    }else if(eventType == "CONNECT"){
        callback(null, successfullResponse);
    }else{
      callback(null, {
        statusCode: 500,
        body: "Unknown event type " + eventType
      });
    }
};

module.exports.defaultMessage = (event, context, callback) => {
  callback(null);
};

module.exports.processMessage = async (event, context, callback) => {
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const connectionId = event.requestContext.connectionId;
  const agma = new AWS.ApiGatewayManagementApi({
    endpoint: domainName + '/' + stage
  });
  console.log("Process message ", connectionId, event.body);

  const message = JSON.parse(event.body);
  message.timestamp = Date.now();
  const action = message.action;
  delete message.action;

  switch(action){
    case "message":
      await analyzeMessage(message);
      if(message.reject){
        await rejectMessage(agma, connectionId, message);
      }else{
        await sendMessageToRoom(agma, connectionId, message);
      }
      break;
    case "init":
      await initConnection(connectionId, message.room, message.lang);
      await sendRoomMessages(agma, connectionId, message.room, message.lang);
      break;
    default:
      callback(null, {
        statusCode: 500,
        body: "Unknown action, failed to process message: " + message
      });
  }
  callback(null, successfullResponse);
};

async function initConnection(connectionId, room, lang) {
    console.log('initConnection', connectionId, room, lang);
    await docClient.put({
        TableName: process.env.CONNECTIONS_TABLE,
        Item: {
            connectionId: connectionId,
            lang: lang,
            room: room
        }
    }).promise();
}

async function sendRoomMessages(agma, connectionId, room, destLang) {
    console.log('sendRoomMessages', connectionId, room, destLang);
    const conversationsData = await docClient.query({
        TableName: process.env.CONVERSATIONS_TABLE,
        KeyConditionExpression: 'room = :room',
        ExpressionAttributeValues: {
            ':room': room
        }
    }).promise();
    const messages = [];
    for (const message of conversationsData.Items) {
        messages.push(message);
    }
    await sendMessagesToConnection(agma, connectionId, messages);
}

async function sendMessageToRoom(agma, sourceConnectionId, message) {
    console.log('sendMessageToRoom', sourceConnectionId, message);

    // get room from connectionId

    const connectionData = await docClient.get({
        TableName: process.env.CHATCONNECTION_TABLE,
        Key: {
            connectionId: sourceConnectionId
        }
    }).promise();

    if (!('room' in connectionData.Item)) {
        return;
    }

    message.room = connectionData.Item.room;

    await storeMessage(message);

    // get all connections from room
    const connectionsData = await docClient.query({
        TableName: process.env.CONNECTIONS_TABLE,
        IndexName: 'roomIndex',
        KeyConditionExpression: 'room = :room',
        ExpressionAttributeValues: {
            ':room': message.room
        }
    }).promise();

    await Promise.all(
        connectionsData.Items.map(async({ connectionId, lang }) => {
            await sendMessagesToConnection(agma, connectionId, [message]);
        })
    );
}

async function storeMessage(message) {
    console.log('storeMessage', message);
    await docClient.put({
        TableName: process.env.CONVERSATIONS_TABLE,
        Item: message
    }).promise();
}
async function analyzeMessage(message) {
  // for future reference on how to filter bad messages: https://github.com/danilop/serverless-positive-chat
}

async function rejectMessage(agma, connectionId, message) {
    console.log('rejectyMessage', connectionId, message);
    message.user = 'Positive Chat';
    message.content = REJECT_MESSAGE;
    await sendMessagesToConnection(agma, connectionId, [message]);
}

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


const deleteConnection = connectionId => {
  const deleteParams = {
    TableName: process.env.CHATCONNECTION_TABLE,
    Key: {
      connectionId: connectionId
    }
  };
  return docClient.delete(deleteParams).promise();
};
