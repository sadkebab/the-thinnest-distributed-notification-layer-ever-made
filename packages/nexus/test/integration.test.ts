import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { exec as execAsync, sleep, useTimeout } from "common/src/utils";
import { exec } from "node:child_process";

import { NexusTestClient, nexusWebsocket } from "common/src/utils/clients";
import {
  TEST_APP_KEY,
  TEST_HOST,
  TEST_PORT,
  TEST_NEXUS_URL,
} from "./constants";

let processId: number;

describe("nexus", async () => {
  before(async () => {
    await execAsync(`pnpm build`);

    const { pid } = exec(
      `HOST=${TEST_HOST} PORT=${TEST_PORT} APP_KEY=${TEST_APP_KEY} pnpm serve`
    );

    if (!pid) throw new Error("Failed to start nexus");
    processId = pid;

    await sleep(300);
  });

  it("respondes", async () => {
    const client = new NexusTestClient(TEST_NEXUS_URL, TEST_APP_KEY);
    const result = await client.status();
    assert.strictEqual(result.status, 200);
  });

  it("it accepts relays", async () => {
    await new Promise<void>((resolve, reject) => {
      const fakeRelay = encodeURIComponent("http://localhost:44443");
      const ws = nexusWebsocket(TEST_NEXUS_URL, fakeRelay);
      const timeout = useTimeout(() => {
        assert.fail("timeout");
      });

      timeout.start();

      ws.on("open", () => {
        // step 1: connection is established
        timeout.reset();
        // step 2: relay sends key
        ws.send(TEST_APP_KEY);
      });

      ws.on("message", (data) => {
        // step 3 success: nexus sends list of relays
        timeout.stop();
        const json = JSON.parse(data.toString());
        assert.deepStrictEqual(json, {
          type: "relay-list",
          relays: [],
        });
        assert.ok(true);
        ws.close();
        resolve();
      });
      ws.on("close", () => {
        // step 3 failure: the connection is closed
        timeout.stop();
        reject(new Error("connection closed"));
      });
    }).catch(() => {
      assert.fail("connection closed by nexus");
    });
  });

  it("rejects requests without app key", async () => {
    await new Promise<void>((resolve, reject) => {
      const fakeRelay = encodeURIComponent("http://localhost:44443");
      const ws = nexusWebsocket(TEST_NEXUS_URL, fakeRelay);
      const timeout = useTimeout(() => {
        assert.fail("timeout");
      });

      timeout.start();

      ws.on("open", () => {
        // step 1: connection is established
        timeout.reset();
        // step 2: beacon sends key
        ws.send("wrong_key");
      });

      ws.on("message", (data) => {
        // step 3 success: nexus sends list of relays
        timeout.stop();
        const json = JSON.parse(data.toString());
        assert.deepStrictEqual(json, {
          type: "relay-list",
          relays: [],
        });
        assert.fail("wrong key has been accepted");
      });
      ws.on("error", () => {
        // step 3 failure: the connection is closed
        timeout.stop();
        reject(new Error("connection closed"));
      });
      ws.on("close", () => {
        // step 3 failure: the connection is closed
        timeout.stop();
        assert.ok(true);
        ws.close();
        resolve();
      });
    }).catch(() => {
      assert.fail("connection closed by nexus");
    });
  });

  after(async () => {
    if (!processId) return;
    await execAsync(`kill ${processId}`);
  });
});
