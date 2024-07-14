import { z } from "zod";

const DEFAULT_PORT = 44443;
const DEFAULT_HOST = "localhost";
const DEFAULT_PROTOCOL = "http";
const DEFAULT_NODE_ENV = "development";
const DEFAULT_RETRY_AFTER_S = 30;

const EnvironmentSchema = z.object({
  APP_KEY: z.string({
    message: "PUSH_KEY is required",
  }),
  HOST: z.string().optional().default(DEFAULT_HOST),
  PORT: z
    .string()
    .optional()
    .default(DEFAULT_PORT.toString())
    .transform((v) => parseInt(v))
    .pipe(z.number().int().min(0).max(65535)),
  PROTOCOL: z.enum(["http", "https"]).optional().default(DEFAULT_PROTOCOL),
  NODE_ENV: z
    .enum(["development", "production"])
    .optional()
    .default(DEFAULT_NODE_ENV),
  NEXUS: z.string().optional(),
  RETRY_AFTER_S: z.number().optional().default(DEFAULT_RETRY_AFTER_S),
});

let env: z.infer<typeof EnvironmentSchema>;

export function useEnv() {
  if (env) return env;
  try {
    env = EnvironmentSchema.parse(process.env);
    return env;
  } catch (error) {
    console.error("Error loading environment variables", error);
    process.exit(1);
  }
}
