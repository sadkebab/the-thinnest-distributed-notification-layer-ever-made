import Fastify from "fastify";
import webSocket from "@fastify/websocket";
import { clientConnections } from "./connections";
import { z, ZodError } from "zod";
import { connectToBeacon, getRunningStatus, pushToOthers } from "./relays";
import { authCheck, AuthError } from "./auth";

import { getEnv } from "./env";

const { PORT } = getEnv();

const fastify = Fastify({
  logger: true,
});

export const logger = fastify.log;

await fastify.register(webSocket, {
  options: { maxPayload: 1048576 },
});

const clients = clientConnections();

fastify.get("/", function (_, reply) {
  reply.send({ status: getRunningStatus() });
});

const pushSchema = z.object({
  topic: z.string(),
  payload: z.any().optional(),
});

fastify.post("/push", function (request, reply) {
  try {
    authCheck(request);
    const body = pushSchema.parse(request.body);

    logger.debug(`pushing ${JSON.stringify(body.payload)} to /t/${body.topic}`);

    clients.get(`/t/${body.topic}`)?.forEach((socket) => {
      socket.send(JSON.stringify(body.payload));
    });

    pushToOthers(body);
    reply.send({ status: "sent", topic: body.topic, payload: body.payload });
  } catch (error) {
    if (error instanceof ZodError) {
      reply.status(400).send({ error: error.flatten().fieldErrors });
      return;
    }
    if (error instanceof AuthError) {
      reply.status(401).send({ error: "Invalid authentication" });
      return;
    }
    throw error;
  }
});

fastify.get("/t/*", { websocket: true }, function (socket, request) {
  clients.set(request.url, socket);
  logger.debug(`Client connected: ${request.ip}`);

  socket.on("close", () => {
    logger.debug(`Client disconnected: ${request.ip}`);
    clients.delete(request.url, socket);
  });
});

fastify.listen({ port: PORT }, function (err) {
  if (err) {
    logger.error(err);
    process.exit(1);
  }
});

connectToBeacon();
