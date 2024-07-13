import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import {
  buildRelay,
  cleanupImage,
  runRelay,
  DockerContext,
} from "./utils/docker";
import { RelayTestClient, topicWebsocket } from "./utils/relay-client";
import WebSocket from "ws";

const TEST_VERSION = new Date()
  .toISOString()
  .split(".")[0]!
  .replace("T", "_")
  .replace("Z", "")
  .replaceAll(":", "")
  .replaceAll("-", "");

const TEST_APP_KEY = "test_app_key";
const TEST_RELAY_URL = "http://localhost:44443";

describe("single-node relay", async () => {
  const context = new DockerContext();
  before(async () => {
    const tag = await buildRelay(TEST_VERSION);
    if (!tag) return;

    await runRelay(tag, TEST_APP_KEY);
    context.set({ tag });
  });

  it("respondes", async () => {
    const clinet = new RelayTestClient(TEST_RELAY_URL, TEST_APP_KEY);
    const result = await clinet.status();
    assert.strictEqual(result.status, 200);
  });

  it("is running in single-node mode", async () => {
    const clinet = new RelayTestClient(TEST_RELAY_URL, TEST_APP_KEY);
    const result = await clinet.status();
    const json = (await result.json()) as { status: "single-node" | "relay" };
    assert.strictEqual(json.status, "single-node");
  });

  it("rejects requests without app key", async () => {
    const client = new RelayTestClient(TEST_RELAY_URL);
    const result = await client.push("test", "test");
    assert.strictEqual(result.status, 401);
  });

  it("rejects requests with invalid app key", async () => {
    const client = new RelayTestClient(TEST_RELAY_URL, "invalid");
    const result = await client.push("test", "test");
    assert.strictEqual(result.status, 401);
  });

  it("reject malformed payloads", async () => {
    const client = new RelayTestClient(TEST_RELAY_URL, TEST_APP_KEY);
    const result = await client.malformedPush("test", "test");
    assert.strictEqual(result.status, 400);
  });

  it("accepts push without payload", async () => {
    const client = new RelayTestClient(TEST_RELAY_URL, TEST_APP_KEY);
    const result = await client.push("test", undefined);
    assert.strictEqual(result.status, 200);
  });

  it("accepts push with valid payloads", async () => {
    const client = new RelayTestClient(TEST_RELAY_URL, TEST_APP_KEY);
    const responses = await Promise.all([
      client.push("test", { test: "test" }),
      client.push("test", ["test"]),
      client.push("test", 123),
      client.push("test", true),
      client.push("test", "yolo"),
    ]);

    responses.forEach((response) => {
      assert.strictEqual(response.status, 200);
    });
  });

  it("connects via websocket", async () => {
    const succeded = await new Promise<boolean>((resolve) => {
      const ws = topicWebsocket(TEST_RELAY_URL, "test");
      ws.on("open", () => {
        ws.close();
        resolve(true);
      });

      setTimeout(() => {
        resolve(false);
      }, 3000);
    });
    assert.strictEqual(succeded, true);
  });

  it("sends the payload to the client", async () => {
    const succeded = await new Promise<boolean>((resolve, reject) => {
      const client = new RelayTestClient(TEST_RELAY_URL, TEST_APP_KEY);
      const ws = topicWebsocket(TEST_RELAY_URL, "test");
      ws.on("message", (data) => {
        const json = JSON.parse(data.toString());
        assert.deepStrictEqual(json, { test: "test" });
        ws.close();
        resolve(true);
      });
      ws.on("open", () => {
        client.push("test", { test: "test" });
        setTimeout(() => {
          reject(new Error("push timeout"));
        }, 3000);
      });
      setTimeout(() => {
        reject(new Error("push timeout"));
      }, 3000);
    });

    assert.strictEqual(succeded, true);
  });

  after(async () => {
    const { tag } = context.get();
    if (!tag) return;
    await cleanupImage(tag);
  });
});
