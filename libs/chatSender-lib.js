import AWS from "aws-sdk";
export async function sendAll(connections, message, domainName, stage){
  const agma = new AWS.ApiGatewayManagementApi({
    endpoint: domainName + '/' + stage
  });
  for(let connectionId of connections){
    try {
        await agma.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(message)
        }).promise();
    }
    catch (err) {
      if (err.statusCode === 410) {
        console.log("Connection is gone for connectionId " + connectionId);
      }else
        throw new Error(err);
    }
  }
}
export async function send(connectionId, message, domainName, stage){
  const agma = new AWS.ApiGatewayManagementApi({
    endpoint: domainName + '/' + stage
  });
    try {
        await agma.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(message)
        }).promise();
    }
    catch (err) {
        if (err.statusCode === 410) {
            console.log("Connection is gone for connectionId " + connectionId);
        }
        else {
            throw err;
        }
    }
}