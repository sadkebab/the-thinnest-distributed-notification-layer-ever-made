import { describe, it } from "node:test";
import assert from "node:assert";
import {
  exec as execAsync,
  sleep,
  snapshotVersion,
} from "../../common/src/utils";
import {
  createImage,
  removeImage,
  removeContainer,
  stopContainer,
} from "../../common/src/utils/docker";
import { TEST_APP_KEY, TEST_NEXUS_URL, TEST_PORT } from "./constants";

const IMAGE_NAME = "nexus-dev";

describe(
  "nexus docker image",
  { skip: process.env.SKIP_DOCKER !== undefined },
  async () => {
    it("builds and runs", async () => {
      const version = snapshotVersion();
      const { tag } = await createImage(IMAGE_NAME, version);
      const { stdout } = await execAsync(
        `docker run -d -p ${TEST_PORT}:${TEST_PORT} -e NODE_ENV=development -e APP_KEY=${TEST_APP_KEY} ${tag}`
      );
      await sleep(1000);

      const constainerId = stdout.trim();
      const response = await fetch(`${TEST_NEXUS_URL}`);

      assert.strictEqual(response.status, 200);

      await stopContainer(constainerId);
      await removeContainer(constainerId);
      await removeImage(tag);
    });
  }
);
