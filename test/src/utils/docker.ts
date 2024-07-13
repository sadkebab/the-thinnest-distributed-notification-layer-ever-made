import util from "node:util";
import { exec as exec_sync } from "node:child_process";
import { sleep } from ".";
const exec = util.promisify(exec_sync);

export async function buildRelay(version: string) {
  await exec(`cd ../relay && IMG_VERSION=${version} pnpm assemble`);
  return `relay-dev:${version}`;
}

export async function runRelay(tag: string, appKey: string, beacon?: string) {
  const command = beacon
    ? `docker run -d -p 44443:44443 -e NODE_ENV=development -e APP_KEY=${appKey} -e BEACON=${beacon} ${tag}`
    : `docker run -d -p 44443:44443 -e NODE_ENV=development -e APP_KEY=${appKey} ${tag}`;
  await exec(command);
  await sleep(1000);
}

export async function cleanupImage(tag: string) {
  const { stdout } = await exec(`docker ps -q --filter ancestor=${tag}`);
  const containers = stdout.trim().split("\n");
  for (const container of containers) {
    await exec(`docker stop ${container}`);
    await exec(`docker rm ${container}`);
  }
  await exec(`docker rmi ${tag}`);
}

export class DockerContext {
  tag?: string;
  constructor() {}

  set(context: { tag: string }) {
    this.tag = context.tag;
  }
  get() {
    return { tag: this.tag };
  }
}
