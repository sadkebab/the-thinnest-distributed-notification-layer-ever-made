import { logger } from ".";
import { getAppKey } from "./auth";
import { useRelayState } from "./state";

export function bounceToOtherNodes(body: unknown) {
  const { nodes } = useRelayState();
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
