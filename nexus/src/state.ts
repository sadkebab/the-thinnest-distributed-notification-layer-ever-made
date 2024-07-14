import type { FastifyBaseLogger } from "fastify";
import type WebSocket from "ws";

let nodes = new Map<string, WebSocket>();

export function useNexusState() {
  return {
    get nodes() {
      return nodes;
    },
  };
}

let logger: FastifyBaseLogger;

export function useLogger() {
  return {
    get logger() {
      if (!logger) throw new Error("Logger not set");
      return logger;
    },
    setLogger(l: FastifyBaseLogger | (() => FastifyBaseLogger)) {
      logger = l instanceof Function ? l() : l;
    },
  };
}
