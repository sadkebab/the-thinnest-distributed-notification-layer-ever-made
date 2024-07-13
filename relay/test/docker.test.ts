import { describe, it } from "node:test";
import assert from "node:assert";
import {
  exec as execAsync,
  sleep,
  snapshotVersion,
} from "../../test/src/utils";
import {
  createImage,
  removeImage,
  removeContainer,
  stopContainer,
} from "../../test/src/utils/docker";
import { RelayTestClient } from "../../test/src/utils/relay-client";
import { TEST_APP_KEY, TEST_RELAY_URL } from "./constants";

const IMAGE_NAME = "relay-dev";

describe("relay docker image", async () => {
  it("builds", async () => {
    const version = snapshotVersion();
    const { tag } = await createImage(IMAGE_NAME, version);
    assert.strictEqual(tag, `${IMAGE_NAME}:${version}`);
    await removeImage(tag);
  });

  it("runs", async () => {
    const version = snapshotVersion();
    const { tag } = await createImage(IMAGE_NAME, version);
    const { stdout } = await execAsync(
      `docker run -d -p 44443:44443 -e NODE_ENV=development -e APP_KEY=${TEST_APP_KEY} ${tag}`
    );
    await sleep(1000);

    const constainerId = stdout.trim();
    const clinet = new RelayTestClient(TEST_RELAY_URL, TEST_APP_KEY);
    const result = await clinet.status();

    assert.strictEqual(result.status, 200);

    await stopContainer(constainerId);
    await removeContainer(constainerId);
    await removeImage(tag);
  });
});
