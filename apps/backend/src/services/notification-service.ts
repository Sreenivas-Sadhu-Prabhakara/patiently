import { randomUUID } from 'node:crypto';
import type { Notification, NotificationType } from '@patiently/shared';
import type { Repository } from '../repository/repository.js';

export interface NotifyInput {
  userId: string;
  wishId?: string;
  type: NotificationType;
  title: string;
  body: string;
}

/**
 * Creates in-app notifications. On a mobile client these same records back the
 * push notifications that drive the approve-to-buy moment (see MOBILE.md) — the
 * service stays transport-agnostic; a push sender plugs in here later.
 */
export class NotificationService {
  constructor(private readonly repo: Repository) {}

  async notify(input: NotifyInput): Promise<Notification> {
    const notification: Notification = {
      id: randomUUID(),
      userId: input.userId,
      ...(input.wishId ? { wishId: input.wishId } : {}),
      type: input.type,
      title: input.title,
      body: input.body,
      read: false,
      createdAt: new Date().toISOString(),
    };
    return this.repo.addNotification(notification);
  }

  list(userId: string, unreadOnly = false): Promise<Notification[]> {
    return this.repo.listNotificationsByUser(userId, unreadOnly);
  }

  markRead(id: string): Promise<void> {
    return this.repo.markNotificationRead(id);
  }
}
