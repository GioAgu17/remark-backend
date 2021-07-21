import handler from "../../libs/handler-lib";
var W3CWebSocket = require('websocket').w3cwebsocket;
export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const url = 'wss://3zxplbfw94.execute-api.us-east-2.amazonaws.com/dev';
  var client = new W3CWebSocket(url, 'echo-protocol');

  client.onerror = function() {
      console.log('Connection Error');
  };

  client.onopen = function() {
      console.log('WebSocket Client Connected');

      function sendMessage() {
          if (client.readyState === client.OPEN) {
              client.send(JSON.stringify(data));
              setTimeout(sendMessage, 1000);
          }
      }
      sendMessage();
  };

  client.onclose = function() {
      console.log('echo-protocol Client Closed');
  };

  client.onmessage = function(e) {
      if (typeof e.data === 'string') {
          console.log("Received: '" + e.data + "'");
      }
  };
});
