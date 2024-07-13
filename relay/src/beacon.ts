import { logger } from ".";

import { setAppKey } from "./auth";
import { z } from "zod";
import { getEnv } from "./env";

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

export function connectToBeacon() {
  const { BEACON, RETRY_AFTER_S } = getEnv();
  if (!BEACON) {
    logger.info("No beacon configured. Running in single-node mode");
    return;
  }

  logger.info(`Connecting to beacon [${BEACON}]`);
  const ws = new WebSocket(
    `ws://${BEACON}/beam/${PROTOCOL}%3A%2F%2F${HOST}%3A${PORT}`
  );

  ws.onopen = () => {
    runningStatus = "relay";
    logger.info(`Connection to beacon [${BEACON}] opened`);
  };
  ws.onmessage = (msg) => {
    try {
      const data = relayListSchema.parse(JSON.parse(msg.data));
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
    setTimeout(connectToBeacon, RETRY_AFTER_S * 1000);
    logger.info(`Connection to beacon [${BEACON}] closed`);
  };
  ws.onerror = (err) => {
    runningStatus = "single-node";
    logger.error(`Connection to beacon [${BEACON}] failed`);
    setTimeout(connectToBeacon, RETRY_AFTER_S * 1000);
  };
}
