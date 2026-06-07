import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { MiddlewareConfig } from './config.js';

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    /** preHandler that rejects unauthenticated requests with 401. */
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/** Register JWT auth and an `authenticate` preHandler decorator. */
export async function registerAuth(app: FastifyInstance, config: MiddlewareConfig): Promise<void> {
  await app.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: '30d' },
  });

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      await reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

export function currentUserId(req: FastifyRequest): string {
  return req.user.sub;
}
