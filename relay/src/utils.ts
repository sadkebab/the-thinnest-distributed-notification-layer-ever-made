import { logger } from ".";
import { getAppKey } from "./auth";
import { relayNodes } from "./nexus";

export function bounceToOthers(body: unknown) {
  const nodes = relayNodes();
  nodes.forEach((connection) => {
    fetch(`http://${connection}/bounce`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Relay-Key": getAppKey(),
      },
      body: JSON.stringify(body),
    }).catch((error) => {
      if (error instanceof Error) {
        logger.error(error.message);
      }
      logger.error(error);
    });
  });
}
