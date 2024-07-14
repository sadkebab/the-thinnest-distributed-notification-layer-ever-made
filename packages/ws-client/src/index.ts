export function RelayWsClient({ url }: { url: string }) {
  const channels = new Map<string, WebSocket>();
  const retry = <T = unknown>(
    topic: string,
    cb: (data: T) => void,
    time = 3000
  ) => {
    setTimeout(() => {
      subscribe(topic, cb);
    }, time);
  };

  const subscribe = <T = unknown>(topic: string, cb: (data: T) => void) => {
    if (channels.has(topic)) {
      return false;
    }
    const ws = new WebSocket(`${url}/t/${topic}`);

    const timer = setTimeout(() => {
      retry(topic, cb, 0);
    }, 3000);

    ws.onopen = () => {
      clearTimeout(timer);
      console.log("Connection opened");
    };
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data.toString());
      cb(data);
    };
    ws.onclose = () => {
      console.error("Connection closed");
      retry(topic, cb);
    };
    ws.onerror = (err) => {
      console.error("Connection error", err);
      retry(topic, cb);
    };

    channels.set(topic, ws);
    return true;
  };
  const unsubscribe = (topic: string) => {
    const ws = channels.get(topic);
    if (!ws) return;
    ws.close();
    channels.delete(topic);
  };
  const clear = () => {
    channels.forEach((ws) => {
      ws.close();
    });
    channels.clear();
  };
  return { subscribe, unsubscribe, clear };
}
