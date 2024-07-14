import type WebSocket from "ws";

let nodes = new Map<string, WebSocket>();

export function useNexusState() {
  return {
    get nodes() {
      return nodes;
    },
  };
}
