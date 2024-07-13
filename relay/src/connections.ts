import type { WebSocket } from "ws";

export function clientConnections() {
  const clientMap = new Map<string, WebSocket[]>();
  return {
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
}
