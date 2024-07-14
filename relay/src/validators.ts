import { z } from "zod";

export const PushSchema = z.object({
  topic: z.string(),
  payload: z.any().optional(),
});

const RelayListSchema = z.object({
  type: z.literal("relay-list"),
  relays: z.array(z.string()),
});

const KeyUpdateSchema = z.object({
  type: z.literal("key-update"),
  key: z.string(),
});

export const NexusMessageSchema = RelayListSchema.or(KeyUpdateSchema);
