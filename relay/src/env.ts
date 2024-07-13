const DEFAULT_PORT = 44443;
const DEFAULT_HOST = "localhost";

let env:
  | {
      PUSH_KEY: string;
      HOST: string;
      PORT: number;
    }
  | undefined = undefined;

export function getEnv() {
  if (env) return env;

  if (!process.env.PUSH_KEY) {
    console.error("PUSH_KEY not set");
    process.exit(1);
  }

  env = {
    PUSH_KEY: process.env.PUSH_KEY,
    HOST: process.env.HOST ?? DEFAULT_HOST,
    PORT: process.env.PORT ? parseInt(process.env.PORT) : DEFAULT_PORT,
  };

  return env;
}
