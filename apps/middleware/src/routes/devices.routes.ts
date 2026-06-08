import type { Backend } from '@patiently/backend';
import type { FastifyInstance } from 'fastify';
import { currentUserId } from '../auth.js';

/**
 * Register / unregister a device's push token. The mobile client calls
 * POST /api/devices on launch (and whenever FCM rotates the token).
 */
export async function deviceRoutes(app: FastifyInstance, backend: Backend): Promise<void> {
  const auth = { preHandler: app.authenticate };

  app.post('/api/devices', auth, async (req, reply) => {
    const device = await backend.devices.register(currentUserId(req), req.body);
    reply.code(201);
    return device;
  });

  app.delete<{ Params: { token: string } }>('/api/devices/:token', auth, async (req) => {
    await backend.devices.unregister(req.params.token);
    return { ok: true };
  });
}
