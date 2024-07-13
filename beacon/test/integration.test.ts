import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { exec as execAsync, sleep } from "../../test/src/utils";
import { exec } from "node:child_process";

import {
  BeaconTestClient,
  beaconWebsocket,
} from "../../test/src/utils/clients";
import {
  TEST_APP_KEY,
  TEST_HOST,
  TEST_PORT,
  TEST_BEACON_URL,
} from "./constants";
import { WebSocket } from "ws";

let processId: number;

describe("beacon", async () => {
  before(async () => {
    await execAsync(`pnpm build`);

    const { pid } = exec(
      `HOST=${TEST_HOST} PORT=${TEST_PORT} APP_KEY=${TEST_APP_KEY} pnpm serve`
    );

    if (!pid) throw new Error("Failed to start beacon");
    processId = pid;

    await sleep(300);
  });

  it("respondes", async () => {
    const client = new BeaconTestClient(TEST_BEACON_URL, TEST_APP_KEY);
    const result = await client.status();
    assert.strictEqual(result.status, 200);
  });

  it("it accepts relays", async () => {
    const fakeRelay = encodeURIComponent("http://localhost:44443");
    const ws = beaconWebsocket(TEST_BEACON_URL, fakeRelay);

    const timeout = setTimeout(() => {
      assert.fail("timeout");
    }, 3000);

    ws.on("open", () => {
      clearTimeout(timeout);
      assert.ok(true);
      ws.close();
    });
  });

  // TODO this test is very hard to read, should be refactored
  it("notifies other relays", async () => {
    const fakeRelayUrl = "http://localhost:44443";
    const fakeRelay = encodeURIComponent(fakeRelayUrl);
    const fakeRelay2Url = "http://localhost:44444";
    const fakeRelay2 = encodeURIComponent(fakeRelay2Url);

    const timeout = setTimeout(() => {
      assert.fail("timeout");
    }, 3000);

    const timeout2 = setTimeout(() => {
      assert.fail("timeout");
    }, 3000);

    const [ws1, ws2] = await Promise.all([
      new Promise<WebSocket>((resolve) => {
        const ws = beaconWebsocket(TEST_BEACON_URL, fakeRelay);
        // this fake relay will reveice a [] when it's connected and a [fakeRelay2Url] when the other fake relay is connected
        const expectedRelays = [[], [fakeRelay2Url]];
        ws.on("open", () => {
          clearTimeout(timeout);
        });

        ws.on("message", (data) => {
          const json = JSON.parse(data.toString());
          if (expectedRelays.length === 0) return;

          assert.deepStrictEqual(json, {
            type: "relay-list",
            relays: expectedRelays.shift(),
          });

          resolve(ws);
        });
      }),
      new Promise<WebSocket>((resolve) => {
        const ws = beaconWebsocket(TEST_BEACON_URL, fakeRelay2);
        // this fake relay will reveice a [fakeRelayUrl] when it's connected
        const expectedRelays = [[fakeRelayUrl]];
        ws.on("open", () => {
          clearTimeout(timeout2);
        });
        ws.on("message", (data) => {
          const json = JSON.parse(data.toString());
          if (expectedRelays.length === 0) return;

          assert.deepStrictEqual(json, {
            type: "relay-list",
            relays: expectedRelays.shift(),
          });

          resolve(ws);
        });
      }),
    ]);

    ws1.close();
    ws2.close();
  });

  after(async () => {
    if (!processId) return;
    await execAsync(`kill ${processId}`);
  });
});
