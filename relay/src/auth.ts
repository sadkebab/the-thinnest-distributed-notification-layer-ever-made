export class AuthError extends Error {
  constructor() {
    super("Invalid authentication");
  }
}

let PUSH_KEY = process.env.PUSH_KEY ?? "testkey";

export function authCheck(request: any) {
  if (
    !request.headers["x-relay-key"] ||
    request.headers["x-relay-key"] !== PUSH_KEY
  ) {
    throw new AuthError();
  }
}

export function getAuthKey() {
  return PUSH_KEY;
}

export function setAuthKey(key: string) {
  PUSH_KEY = key;
}
