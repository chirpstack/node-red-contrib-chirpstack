module.exports = function(RED) {
  "use strict";
  var multicastGroup = require("@chirpstack/chirpstack-api/api/multicast_group_grpc_pb");
  var multicastGroup_pb = require("@chirpstack/chirpstack-api/api/multicast_group_pb");
  var grpc = require("@grpc/grpc-js");

  function MulticastGroupDownlink(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var client = null;

    if (config.useTls) {
      client = new multicastGroup.MulticastGroupServiceClient(config.server, grpc.credentials.createSsl());
    } else {
      client = new multicastGroup.MulticastGroupServiceClient(config.server, grpc.credentials.createInsecure());
    }


    var meta = new grpc.Metadata();
    meta.add('authorization', 'Bearer ' + config.apiToken);


    node.on("input", function(msg) {

      var item = new multicastGroup_pb.MulticastGroupQueueItem();
      var req = new multicastGroup_pb.EnqueueMulticastGroupQueueItemRequest();

      if (msg.multicastGroupId === undefined) {
        node.error("multicastGroupId is undefined");
        return;
      } else {
        item.setMulticastGroupId(msg.multicastGroupId);
      }

      if (msg.fPort === undefined) {
        node.error("fPort is undefined");
        return;
      } else {
        item.setFPort(msg.fPort);
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
            fCnt: resp.getFCnt()
          });
        }
      });
    });
  }

  RED.nodes.registerType("multicast group downlink", MulticastGroupDownlink);
}
