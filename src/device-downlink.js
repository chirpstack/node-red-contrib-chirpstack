module.exports = function(RED) {
  "use strict";
  var device = require("@chirpstack/chirpstack-api/as/external/api/deviceQueue_grpc_pb");
  var device_pb = require("@chirpstack/chirpstack-api/as/external/api/deviceQueue_pb");
  var grpc = require("@grpc/grpc-js");

  function DeviceDownlink(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var client = null;

    if (config.useTls) {
      client = new device.DeviceQueueServiceClient(config.server, grpc.credentials.createSsl());
    } else {
      client = new device.DeviceQueueServiceClient("localhost:8080", grpc.credentials.createInsecure());
    }


    var meta = new grpc.Metadata();
    meta.add('authorization', config.apiToken);


    node.on("input", function(msg) {

      var item = new device_pb.DeviceQueueItem();
      var req = new device_pb.EnqueueDeviceQueueItemRequest();

      if (msg.devEUI === undefined) {
        node.error("devEUI is undefined");
        return;
      } else {
        item.setDevEui(msg.devEUI);
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

      req.setDeviceQueueItem(item);
      client.enqueue(req, meta, function(err, resp) {
        if (err !== null) {
          node.error("Enqueue error: ", err);
        } else {
          node.log("Downlink enqueued");

          node.send({
            fCnt: resp.getFCnt()
          });
        }
      });
    });
  }

  RED.nodes.registerType("device downlink", DeviceDownlink);
}
