import { z } from "zod";

const DEFAULT_PORT = 44401;
const DEFAULT_HOST = "localhost";
const DEFAULT_RELAY_TIMEOUT = 5;

const EnvironmentSchema = z.object({
  APP_KEY: z.string({
    message: "APP_KEY not set",
  }),
  HOST: z.string().optional().default(DEFAULT_HOST),
  PORT: z
    .string()
    .optional()
    .default(DEFAULT_PORT.toString())
    .transform((v) => parseInt(v))
    .pipe(z.number().int().min(0).max(65535)),
  RELAY_TIMEOUT: z
    .string()
    .optional()
    .default(DEFAULT_RELAY_TIMEOUT.toString())
    .transform((v) => parseInt(v))
    .pipe(z.number().int().min(0).max(60)),
  NODE_ENV: z
    .enum(["development", "production"])
    .optional()
    .default("development"),
});

let env: z.infer<typeof EnvironmentSchema>;

export function useEnv() {
  if (env) return env;
  try {
    env = EnvironmentSchema.parse(process.env);

    return env;
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
