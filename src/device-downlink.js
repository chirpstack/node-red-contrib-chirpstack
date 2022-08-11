module.exports = function(RED) {
  "use strict";
  var device = require("@chirpstack/chirpstack-api/api/device_grpc_pb");
  var device_pb = require("@chirpstack/chirpstack-api/api/device_pb");
  var grpc = require("@grpc/grpc-js");

  function DeviceDownlink(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var client = null;

    if (config.useTls) {
      client = new device.DeviceServiceClient(config.server, grpc.credentials.createSsl());
    } else {
      client = new device.DeviceServiceClient(config.server, grpc.credentials.createInsecure());
    }


    var meta = new grpc.Metadata();
    meta.add('authorization', 'Bearer ' + config.apiToken);


    node.on("input", function(msg) {

      var item = new device_pb.DeviceQueueItem();
      var req = new device_pb.EnqueueDeviceQueueItemRequest();

      if (msg.devEui === undefined) {
        node.error("devEui is undefined");
        return;
      } else {
        item.setDevEui(msg.devEui);
      }

      if (msg.fPort === undefined) {
        node.error("fPort is undefined");
        return;
      } else {
        item.setFPort(msg.fPort);
      }

      if (msg.confirmed === undefined) {
        node.error("confirmed is undefined");
        return;
      } else {
        item.setConfirmed(msg.confirmed);
      }

      if (msg.payload !== undefined) {
        item.setData(Buffer.from(msg.payload, config.encoding).toString("base64"));
      } else {
        node.log("payload is undefined, assuming empty downlink frame");
      }

      req.setQueueItem(item);
      client.enqueue(req, meta, function(err, resp) {
        if (err !== null) {
          node.error("Enqueue error: ", err);
        } else {
          node.log("Downlink enqueued");

          node.send({
            id: resp.getId()
          });
        }
      });
    });
  }

  RED.nodes.registerType("device downlink", DeviceDownlink);
}
