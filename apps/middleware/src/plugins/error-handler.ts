import { NoPendingDecisionError, WishNotFoundError } from '@patiently/backend';
import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

/** Translate domain and validation errors into consistent HTTP responses. */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, req, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: 'ValidationError', details: error.flatten() });
    }
    if (error instanceof WishNotFoundError) {
      return reply.code(404).send({ error: error.message });
    }
    if (error instanceof NoPendingDecisionError) {
      return reply.code(409).send({ error: error.message });
    }
    if (error.validation) {
      return reply.code(400).send({ error: 'ValidationError', details: error.validation });
    }

    const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    if (status >= 500) req.log.error(error);
    return reply
      .code(status)
      .send({ error: status === 500 ? 'Internal Server Error' : error.message });
  });
}
