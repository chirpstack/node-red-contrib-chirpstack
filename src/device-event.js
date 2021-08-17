module.exports = function(RED) {
  "use strict";
  var uuid = require('uuid');

  function DeviceEvent(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.on('input', function(msg) {
      let payload = msg.payload;

      if (typeof payload === "string") {
        payload = JSON.parse(payload);
      }

      if (payload.devEUI !== undefined) {
        payload.devEUI = Buffer.from(payload.devEUI, "base64").toString("hex");
      } 

      if (payload.devAddr !== undefined) {
        payload.devAddr = Buffer.from(payload.devAddr, "base64").toString("hex");
      }

      if (payload.gatewayID !== undefined) {
        payload.gatewayID = Buffer.from(payload.gatewayID, "base64").toString("hex");
      }

      if (payload.objectJSON !== undefined && payload.objectJSON != "") {
        payload.objectJSON = JSON.parse(payload.objectJSON);
      } else {
        payload.objectJSON = null;
      }

      if (payload.rxInfo !== undefined) {
        for (let i = 0; i < payload.rxInfo.length; i++) {
          payload.rxInfo[i].gatewayID = Buffer.from(payload.rxInfo[i].gatewayID, "base64").toString("hex");
          payload.rxInfo[i].uplinkID = uuid.stringify(Buffer.from(payload.rxInfo[i].uplinkID, "base64"));
        }
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
