import "dotenv/config";
import Fastify from "fastify";
import webSocket from "@fastify/websocket";
import type { WebSocket } from "ws";
import { getEnv } from "./env";

const { HOST, PORT, NODE_ENV } = getEnv();

const fastify = Fastify({
  logger: true,
});

const logger = fastify.log;
if (NODE_ENV === "development") {
  logger.level = "debug";
}

async function start() {
  await fastify.register(webSocket, {
    options: { maxPayload: 1048576 },
  });

  let nodes = new Map<string, WebSocket>();

  fastify.get("/", function (_, reply) {
    reply.send({ status: "Running", nodes });
  });

  function notifyNodeUpdate() {
    const current = Array.from(nodes.keys());

    for (const [key, nodeSocket] of nodes) {
      nodeSocket.send(
        JSON.stringify({
          type: "relay-list",
          relays: current.filter((node) => node !== key),
        })
      );
    }
  }

  function parseNode(params: any): string {
    if (!params.node) throw new Error("Missing node");
    if (typeof params.node !== "string") throw new Error("Invalid node");

    return params.node;
  }

  fastify.get("/beam/:node", { websocket: true }, function (socket, request) {
    const node = parseNode(request.params);
    nodes.set(node, socket);
    logger.info(`Added node ${node}`);
    notifyNodeUpdate();

    socket.on("close", () => {
      logger.info(`Removing node: ${node}`);
      nodes.delete(node);
      notifyNodeUpdate();
    });
  });

  fastify.listen({ port: PORT, host: HOST }, function (err) {
    if (err) {
      logger.error(err);
      process.exit(1);
    }
  });
}
start();
