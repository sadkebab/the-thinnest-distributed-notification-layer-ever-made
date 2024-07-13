import { getEnv } from "./env";

export class AuthError extends Error {
  constructor() {
    super("Invalid authentication");
  }
}

let { APP_KEY } = getEnv();

export function authCheck(request: any) {
  if (
    !request.headers["x-relay-key"] ||
    request.headers["x-relay-key"] !== APP_KEY
  ) {
    throw new AuthError();
  }
}

export function getAppKey() {
  return APP_KEY;
}

export function setAppKey(key: string) {
  APP_KEY = key;
}
