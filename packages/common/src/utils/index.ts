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

export function useTimeout(cb: () => void) {
  let timeout: NodeJS.Timeout;

  const start = (time = 3000) => {
    timeout = setTimeout(cb, time);
  };

  const stop = () => {
    clearTimeout(timeout);
  };

  const reset = (time?: number) => {
    stop();
    start(time);
  };

  return {
    start,
    stop,
    reset,
  };
}
