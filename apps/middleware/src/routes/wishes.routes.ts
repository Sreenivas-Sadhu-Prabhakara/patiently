import type { Backend } from '@patiently/backend';
import type { FastifyInstance } from 'fastify';
import { currentUserId } from '../auth.js';

interface IdParam {
  id: string;
}

export async function wishRoutes(app: FastifyInstance, backend: Backend): Promise<void> {
  const auth = { preHandler: app.authenticate };

  // List all of the user's wishes, each enriched with its best offer + savings.
  app.get('/api/wishes', auth, async (req) => backend.wishes.listWishViews(currentUserId(req)));

  // Create a wish (the "what I want in 3–6 months" intent).
  app.post('/api/wishes', auth, async (req, reply) => {
    const userId = currentUserId(req);
    const wish = await backend.wishes.createWish(userId, req.body);
    reply.code(201);
    return backend.wishes.buildWishView(userId, wish.id);
  });

  app.get<{ Params: IdParam }>('/api/wishes/:id', auth, async (req) =>
    backend.wishes.buildWishView(currentUserId(req), req.params.id),
  );

  app.patch<{ Params: IdParam }>('/api/wishes/:id', auth, async (req) =>
    backend.wishes.updateWish(currentUserId(req), req.params.id, req.body),
  );

  app.delete<{ Params: IdParam }>('/api/wishes/:id', auth, async (req) =>
    backend.wishes.cancelWish(currentUserId(req), req.params.id),
  );

  // Run the daily search immediately for one wish (handy for demos / "check now").
  app.post<{ Params: IdParam }>('/api/wishes/:id/search', auth, async (req) => {
    const userId = currentUserId(req);
    const wish = await backend.wishes.getOwnedWish(userId, req.params.id);
    const result = await backend.search.runForWish(wish);
    const view = await backend.wishes.buildWishView(userId, wish.id);
    return { result, view };
  });

  // Approve or reject a pending purchase proposal (human-in-the-loop).
  app.post<{ Params: IdParam }>('/api/wishes/:id/decision', auth, async (req) =>
    backend.purchases.decide(currentUserId(req), req.params.id, req.body),
  );
}
