import { logger } from ".";
import { parseArgs } from "./args";
import { getAuthKey, setAuthKey } from "./auth";
import { z } from "zod";
import { getEnv } from "./env";

let relays = [] as string[];
let runningStatus: "single-node" | "relay" = "single-node";

const { HOST, PORT } = getEnv();

export function pushToOthers(body: unknown) {
  relays.forEach((connection) => {
    fetch(`${connection}/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Relay-Key": getAuthKey(),
      },
      body: JSON.stringify(body),
    }).catch(logger.error);
  });
}

export function getRunningStatus() {
  return runningStatus;
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
  const { beacon, retryAfterSeconds } = parseArgs();
  logger.info(`Connecting to beacon [${beacon}]`);
  const ws = new WebSocket(`ws://${beacon}/beam`);
  ws.onopen = () => {
    runningStatus = "relay";
    logger.info(`Connection to beacon [${beacon}] opened`);
    fetch(`${beacon}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Relay-Key": getAuthKey(),
      },
      body: JSON.stringify({ relay: `${HOST}:${PORT}` }),
    }).catch(logger.error);
  };
  ws.onmessage = (msg) => {
    try {
      const data = relayListSchema.parse(JSON.parse(msg.data));
      switch (data.type) {
        case "key-update":
          setAuthKey(data.key);
          break;
        case "relay-list":
          relays = data.relays;
          break;
      }
    } catch (e) {
      logger.error(e);
      return;
    }
  };
  ws.onclose = () => {
    runningStatus = "single-node";
    setTimeout(connectToBeacon, retryAfterSeconds * 1000);
    logger.info(`Connection to beacon [${beacon}] closed`);
  };
  ws.onerror = (err) => {
    runningStatus = "single-node";
    logger.error(`Connection to beacon [${beacon}] failed`);
    setTimeout(connectToBeacon, retryAfterSeconds * 1000);
  };
}
