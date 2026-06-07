import type { Backend } from '@patiently/backend';
import type { FastifyInstance } from 'fastify';
import { currentUserId } from '../auth.js';

export async function notificationRoutes(app: FastifyInstance, backend: Backend): Promise<void> {
  const auth = { preHandler: app.authenticate };

  app.get<{ Querystring: { unread?: string } }>('/api/notifications', auth, async (req) =>
    backend.notifications.list(currentUserId(req), req.query.unread === '1'),
  );

  app.post<{ Params: { id: string } }>('/api/notifications/:id/read', auth, async (req) => {
    await backend.notifications.markRead(req.params.id);
    return { ok: true };
  });
}
