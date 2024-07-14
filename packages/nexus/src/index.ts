import "dotenv/config";
import Fastify from "fastify";
import webSocket from "@fastify/websocket";
import { useEnv } from "./env";
import { beaconConnectionContext } from "./connection-context";
import { useNexusState } from "./state";
import { useLogger } from "./state";

const { HOST, PORT, NODE_ENV, RELAY_TIMEOUT } = useEnv();
const { setLogger } = useLogger();

const fastify = Fastify({
  logger: true,
});

setLogger(() => {
  if (NODE_ENV === "development") {
    fastify.log.level = "debug";
  }
  return fastify.log;
});

async function start() {
  await fastify.register(webSocket, {
    options: { maxPayload: 1048576 },
  });

  fastify.get("/", function (_, reply) {
    const { nodes } = useNexusState();
    reply.send({ status: "Running", nodes });
  });

  function updateOtherRelays(skip: string) {
    const { nodes } = useNexusState();
    const current = Array.from(nodes.keys());

    for (const [key, nodeSocket] of nodes) {
      if (key === skip) continue;
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

  // TODO maybe we can state change better with something like xstate
  // step 1: connection is enstablished
  // step 2: beacon sends key
  // step 3: nexus sends list of relays if the key matches or closes connection if it doesn't

  fastify.get("/link/:node", { websocket: true }, function (socket, request) {
    const { logger } = useLogger();
    const node = parseNode(request.params);
    const context = beaconConnectionContext();

    const connectionTimeout = setTimeout(() => {
      if (!context.isAuthenticated()) {
        logger.info(`Relay ${node} timed out`);
        socket.close();
      }
    }, RELAY_TIMEOUT * 1000);

    socket.on("message", (data) => {
      if (context.isAuthenticated()) return;
      clearTimeout(connectionTimeout);
      const { nodes } = useNexusState();

      if (context.validateKey(data.toString())) {
        logger.info(`Relay ${node} authenticated`);
        nodes.set(node, socket);
        updateOtherRelays(node);
        const current = Array.from(nodes.keys());
        socket.send(
          JSON.stringify({
            type: "relay-list",
            relays: current.filter((k) => k !== node),
          })
        );
      } else {
        logger.info(`Relay ${node} failed to authenticate`);
        socket.close();
      }
    });

    socket.on("error", (error) => {
      logger.error(`Error on socket for ${node}`);
      logger.error(error);
    });

    socket.on("close", () => {
      if (!context.isAuthenticated()) return;
      const { nodes } = useNexusState();

      logger.info(`Relay disconnected: ${node}`);
      nodes.delete(node);
      updateOtherRelays(node);
    });
  });

  fastify.listen({ port: PORT, host: HOST }, function (err) {
    const { logger } = useLogger();
    if (err) {
      logger.error(err);
      process.exit(1);
    }
  });
}
start();
