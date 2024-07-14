import "dotenv/config";
import Fastify from "fastify";
import webSocket from "@fastify/websocket";

import { ZodError } from "zod";
import { connectToNexus } from "./nexus-connection";
import { authCheck, AuthError } from "./auth";
import { useRelayState } from "./state";

import { useEnv } from "./env";
import { bounceToOtherNodes } from "./bounce";
import { PushSchema } from "./validators";
import { useLogger } from "./state";

const { PORT, HOST, NODE_ENV } = useEnv();

const fastify = Fastify({
  logger: true,
  disableRequestLogging: true,
});

const { setLogger } = useLogger();
setLogger(() => {
  if (NODE_ENV === "development") {
    fastify.log.level = "debug";
  }
  return fastify.log;
});

async function start() {
  await fastify.register(webSocket, {
    options: { maxPayload: 1048576 },
  });

  fastify.get("/", function (_, reply) {
    const { runningStatus } = useRelayState();
    reply.send({ status: runningStatus });
  });

  fastify.post("/push", function (request, reply) {
    const { clients } = useRelayState();
    const { logger } = useLogger();
    try {
      authCheck(request);
      const body = PushSchema.parse(request.body);

      logger.debug(
        `pushing ${JSON.stringify(body.payload)} to /t/${body.topic}`
      );

      clients.get(`/t/${body.topic}`)?.forEach((socket) => {
        socket.send(JSON.stringify(body.payload));
      });

      bounceToOtherNodes(body);
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
    const { clients } = useRelayState();
    const { logger } = useLogger();
    try {
      authCheck(request);
      const body = PushSchema.parse(request.body);

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
    const { clients } = useRelayState();
    const { logger } = useLogger();
    clients.set(request.url, socket);
    logger.debug(`Client connected: ${request.ip}`);

    socket.on("close", () => {
      logger.debug(`Client disconnected: ${request.ip}`);
      clients.delete(request.url, socket);
    });
  });

  fastify.listen({ port: PORT, host: HOST }, function (err) {
    const { logger } = useLogger();
    if (err) {
      logger.error(err);
      process.exit(1);
    }
  });
}

start();
connectToNexus();
