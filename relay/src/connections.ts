import type { WebSocket } from "ws";

export function clientConnections() {
  const cache = new Map<string, WebSocket[]>();
  return {
    get(key: string) {
      return cache.get(key);
    },
    set(key: string, connection: WebSocket) {
      const current = cache.get(key) || [];
      cache.set(key, [...current, connection]);
    },
    delete(key: string, connection: WebSocket) {
      const current = cache.get(key);
      if (!current) return;
      const updated = current.filter((c) => c !== connection);
      if (updated.length === 0) {
        cache.delete(key);
      } else {
        cache.set(key, updated);
      }
    },
    clear() {
      cache.clear();
    },
  };
}
