import type { Backend } from '@patiently/backend';
import type { AuthResponse } from '@patiently/shared';
import type { FastifyInstance } from 'fastify';
import { currentUserId } from '../auth.js';

export async function authRoutes(app: FastifyInstance, backend: Backend): Promise<void> {
  // Passwordless MVP login: find-or-create by email, return a signed JWT.
  app.post('/api/auth/login', async (req, reply): Promise<AuthResponse> => {
    const user = await backend.users.loginOrCreate(req.body);
    const token = await reply.jwtSign({ sub: user.id, email: user.email });
    return { token, user };
  });

  app.get('/api/auth/me', { preHandler: app.authenticate }, async (req, reply) => {
    const user = await backend.users.getUser(currentUserId(req));
    if (!user) return reply.code(404).send({ error: 'User not found' });
    return user;
  });
}
