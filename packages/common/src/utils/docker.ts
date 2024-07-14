import { exec, sleep } from ".";

export async function buildRelay(version: string) {
  await exec(`cd ../relay && IMG_VERSION=${version} pnpm assemble`);
  return `relay-dev:${version}`;
}

export async function runRelay(tag: string, appKey: string, nexus?: string) {
  const command = nexus
    ? `docker run -d -p 44443:44443 -e NODE_ENV=development -e APP_KEY=${appKey} -e NEXUS=${nexus} ${tag}`
    : `docker run -d -p 44443:44443 -e NODE_ENV=development -e APP_KEY=${appKey} ${tag}`;
  await exec(command);
  await sleep(1000);
}

export async function createImage(name: string, version: string) {
  await exec(`docker build -t ${name}:${version} -f Dockerfile .`);
  const { stdout } = await exec(
    `docker images ${name} --format "{{.ID}} {{.Repository}}:{{.Tag}}" | grep ${version}`
  );
  const [id, tag] = stdout.trim().split(" ");
  if (!id || !tag) throw new Error("Failed to create image");
  return { id, tag };
}
export async function stopContainer(id: string) {
  await exec(`docker stop ${id}`);
}

export async function removeContainer(id: string) {
  await exec(`docker rm ${id}`);
}

export async function removeImage(tag: string) {
  await exec(`docker rmi ${tag}`);
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
