import { logger } from ".";

import { setAppKey } from "./auth";
import { z } from "zod";
import { getEnv } from "./env";
import { WebSocket } from "ws";

let nodes = [] as string[];
let runningStatus: "single-node" | "relay" = "single-node";

const { HOST, PORT, PROTOCOL } = getEnv();

export function getRunningStatus() {
  return runningStatus;
}
export function relayNodes() {
  return nodes;
}

const relayListSchema = z
  .object({
    type: z.literal("relay-list"),
    relays: z.array(z.string()),
  })
  .or(
    z.object({
      type: z.literal("key-update"),
      key: z.string(),
    })
  );

export function connectToNexus() {
  const { NEXUS, RETRY_AFTER_S } = getEnv();
  if (!NEXUS) {
    logger.info("No nexus configured. Running in single-node mode");
    return;
  }

  logger.info(`Connecting to nexus [${NEXUS}]`);
  const ws = new WebSocket(
    `ws://${NEXUS}/beam/${PROTOCOL}%3A%2F%2F${HOST}%3A${PORT}`
  );

  ws.onopen = () => {
    runningStatus = "relay";
    logger.info(`Connection to nexus [${NEXUS}] opened`);
  };
  ws.onmessage = (msg) => {
    try {
      const data = relayListSchema.parse(JSON.parse(msg.data.toString()));
      switch (data.type) {
        case "key-update":
          logger.info(`Key updated`);
          setAppKey(data.key);
          break;
        case "relay-list":
          logger.info(`Relays updated`);
          logger.debug(data.relays);
          nodes = data.relays;
          break;
      }
    } catch (e) {
      logger.error(e);
      return;
    }
  };
  ws.onclose = () => {
    runningStatus = "single-node";
    setTimeout(connectToNexus, RETRY_AFTER_S * 1000);
    logger.info(`Connection to nexus [${NEXUS}] closed`);
  };
  ws.onerror = (err) => {
    runningStatus = "single-node";
    logger.error(`Connection to nexus [${NEXUS}] failed`);
    setTimeout(connectToNexus, RETRY_AFTER_S * 1000);
  };
}
