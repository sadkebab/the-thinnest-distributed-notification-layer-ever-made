import WebSocket from "ws";

export class RelayTestClient {
  constructor(private url: string, private appKey?: string) {}

  async push(topic: string, payload: any) {
    const headers: {
      "Content-Type": string;
      "X-Relay-Key"?: string;
    } = {
      "Content-Type": "application/json",
    };
    if (this.appKey) {
      headers["X-Relay-Key"] = this.appKey;
    }

    const response = await fetch(`${this.url}/push`, {
      method: "POST",
      headers,
      body: JSON.stringify({ topic, payload }),
    });

    return response;
  }

  async malformedPush(topic: string, payload: any) {
    const headers: {
      "Content-Type": string;
      "X-Relay-Key"?: string;
    } = {
      "Content-Type": "application/json",
    };
    if (this.appKey) {
      headers["X-Relay-Key"] = this.appKey;
    }

    const response = await fetch(`${this.url}/push`, {
      method: "POST",
      headers,
      body: JSON.stringify({ aosidaois: topic, wowo: payload }),
    });

    return response;
  }

  async status() {
    const response = await fetch(this.url);
    return response;
  }
}
export function topicWebsocket(url: string, topic: string) {
  const ws = new WebSocket(url.replace("http", "ws") + "/t/" + topic);
  return ws;
}

export class BeaconTestClient {
  constructor(private url: string, private appKey?: string) {}

  async status() {
    const response = await fetch(this.url);
    return response;
  }
}

export function beaconWebsocket(url: string, nodeUrl: string) {
  const ws = new WebSocket(url.replace("http", "ws") + "/beam/" + nodeUrl);
  return ws;
}
