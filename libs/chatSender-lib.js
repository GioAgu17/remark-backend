import AWS from "aws-sdk";
export async function sendAll(connections, message, domainName, stage){
  var failedConnectionIds = [];
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
        failedConnectionIds.push(connectionId);
      }else
        throw new Error(err);
    }
  }
  return failedConnectionIds;
}