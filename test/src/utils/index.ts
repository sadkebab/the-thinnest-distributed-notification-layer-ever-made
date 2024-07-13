import util from "node:util";
import { exec as exec_sync } from "node:child_process";

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const exec = util.promisify(exec_sync);

export function snapshotVersion() {
  return new Date()
    .toISOString()
    .split(".")[0]!
    .replace("T", ".")
    .replace("Z", "")
    .replaceAll(":", ".")
    .replaceAll("-", ".");
}
