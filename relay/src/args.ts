const DEFAULT_RETRY_AFTER_SECONDS = 10;
const args = process.argv.slice(2);
let parsedArgs:
  | {
      beacon?: string;

      retryAfterSeconds: number;
    }
  | undefined = undefined;

export function parseArgs() {
  if (parsedArgs) return parsedArgs;

  parsedArgs = {
    beacon: args[0],
    retryAfterSeconds: args[1]
      ? parseInt(args[1])
      : DEFAULT_RETRY_AFTER_SECONDS,
  };

  return parsedArgs;
}
