module.exports = function(RED) {
  "use strict";

  function DeviceEvent(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.on('input', function(msg) {
      let payload = msg.payload;

      if (typeof payload === "string") {
        payload = JSON.parse(payload);
      }

      if (msg.topic.endsWith(config.eventType)) {
        node.send({
          payload: payload,
        });
      }
    });
  }

  RED.nodes.registerType('device event', DeviceEvent);
}
