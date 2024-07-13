import "dotenv/config";
import Fastify from "fastify";
import webSocket from "@fastify/websocket";
import { clientConnections } from "./connections";
import { z, ZodError } from "zod";
import { connectToBeacon, getRunningStatus } from "./beacon";
import { authCheck, AuthError } from "./auth";

import { getEnv } from "./env";
import { bounceToOthers } from "./utils";

const { PORT, HOST, NODE_ENV } = getEnv();
const fastify = Fastify({
  logger: true,
  disableRequestLogging: true,
});

export const logger = fastify.log;
const clients = clientConnections();

const pushSchema = z.object({
  topic: z.string(),
  payload: z.any().optional(),
});

if (NODE_ENV === "development") {
  logger.level = "debug";
}

async function start() {
  await fastify.register(webSocket, {
    options: { maxPayload: 1048576 },
  });

  fastify.get("/", function (_, reply) {
    reply.send({ status: getRunningStatus() });
  });

  fastify.post("/push", function (request, reply) {
    try {
      authCheck(request);
      const body = pushSchema.parse(request.body);

      logger.debug(
        `pushing ${JSON.stringify(body.payload)} to /t/${body.topic}`
      );

      clients.get(`/t/${body.topic}`)?.forEach((socket) => {
        socket.send(JSON.stringify(body.payload));
      });

      bounceToOthers(body);
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

  fastify.post("/bounce", function (request, reply) {
    try {
      authCheck(request);
      const body = pushSchema.parse(request.body);

      logger.debug(
        `bouncing ${JSON.stringify(body.payload)} to /t/${body.topic}`
      );

      clients.get(`/t/${body.topic}`)?.forEach((socket) => {
        socket.send(JSON.stringify(body.payload));
      });

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

  fastify.listen({ port: PORT, host: HOST }, function (err) {
    if (err) {
      logger.error(err);
      process.exit(1);
    }
  });
}

start();
connectToBeacon();
