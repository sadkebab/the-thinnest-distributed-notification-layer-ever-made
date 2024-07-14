import { logger } from ".";

import { setAppKey } from "./auth";
import { z } from "zod";
import { useEnv } from "./env";
import { WebSocket } from "ws";
import { useRelayState } from "./state";
import { NexusMessageSchema } from "./validators";

const { HOST, PORT, PROTOCOL } = useEnv();

export function connectToNexus() {
  const { updateNodes, setRunningStatus } = useRelayState();
  const { NEXUS, RETRY_AFTER_S } = useEnv();
  if (!NEXUS) {
    logger.info("No nexus configured. Running in single-node mode");
    return;
  }

  logger.info(`Connecting to nexus [${NEXUS}]`);
  const ws = new WebSocket(
    `ws://${NEXUS}/link/${PROTOCOL}%3A%2F%2F${HOST}%3A${PORT}`
  );

  ws.onopen = () => {
    setRunningStatus("relay");
    logger.info(`Connection to nexus [${NEXUS}] opened`);
    const { APP_KEY } = useEnv();
    ws.send(APP_KEY);
  };
  ws.onmessage = (msg) => {
    try {
      const data = NexusMessageSchema.parse(JSON.parse(msg.data.toString()));
      switch (data.type) {
        case "key-update":
          logger.info(`Key updated`);
          setAppKey(data.key);
          break;
        case "relay-list":
          logger.info(`Relays updated`);
          logger.debug(data.relays);
          updateNodes(data.relays);
          break;
      }
    } catch (e) {
      logger.error(e);
      return;
    }
  };
  ws.onclose = () => {
    setRunningStatus("single-node");
    setTimeout(connectToNexus, RETRY_AFTER_S * 1000);
    logger.info(`Connection to nexus [${NEXUS}] closed`);
  };
  ws.onerror = (err) => {
    setRunningStatus("single-node");
    logger.error(`Connection to nexus [${NEXUS}] failed`);
    setTimeout(connectToNexus, RETRY_AFTER_S * 1000);
  };
}
