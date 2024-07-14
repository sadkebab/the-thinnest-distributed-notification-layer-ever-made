import { WebSocket } from "ws";

let nodes = [] as string[];
let runningStatus: "single-node" | "relay" = "single-node";
const clientMap = new Map<string, WebSocket[]>();

const clients = {
  get(key: string) {
    return clientMap.get(key);
  },
  set(key: string, connection: WebSocket) {
    const current = clientMap.get(key) || [];
    clientMap.set(key, [...current, connection]);
  },
  delete(key: string, connection: WebSocket) {
    const current = clientMap.get(key);
    if (!current) return;
    const updated = current.filter((c) => c !== connection);
    if (updated.length === 0) {
      clientMap.delete(key);
    } else {
      clientMap.set(key, updated);
    }
  },
  clear() {
    clientMap.clear();
  },
};

function updateNodes(newNodes: string[]) {
  nodes = newNodes;
}

function setRunningStatus(status: "single-node" | "relay") {
  runningStatus = status;
}

export function useRelayState() {
  return {
    get runningStatus() {
      return runningStatus;
    },
    get nodes() {
      return nodes;
    },
    get clients() {
      return clients;
    },
    updateNodes,
    setRunningStatus,
  };
}
