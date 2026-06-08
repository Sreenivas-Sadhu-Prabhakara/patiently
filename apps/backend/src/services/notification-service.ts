import { randomUUID } from 'node:crypto';
import type { Notification, NotificationType } from '@patiently/shared';
import type { Repository } from '../repository/repository.js';
import type { PushSender } from '../push/push-sender.js';

export interface NotifyInput {
  userId: string;
  wishId?: string;
  type: NotificationType;
  title: string;
  body: string;
}

/**
 * Creates in-app notifications and fans them out as push notifications to the
 * user's registered devices — this is the seam that drives the approve-to-buy
 * buzz on the phone. Push failures are swallowed so they never break the core
 * flow (the in-app record is the source of truth).
 */
export class NotificationService {
  constructor(
    private readonly repo: Repository,
    private readonly push: PushSender,
  ) {}

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
    await this.repo.addNotification(notification);
    await this.sendPush(notification);
    return notification;
  }

  private async sendPush(notification: Notification): Promise<void> {
    try {
      const devices = await this.repo.listDeviceTokensByUser(notification.userId);
      if (devices.length === 0) return;
      await this.push.send(
        devices.map((d) => d.token),
        {
          title: notification.title,
          body: notification.body,
          data: {
            type: notification.type,
            ...(notification.wishId ? { wishId: notification.wishId } : {}),
          },
        },
      );
    } catch (err) {
      console.error('[notifications] push send failed (ignored):', err);
    }
  }

  list(userId: string, unreadOnly = false): Promise<Notification[]> {
    return this.repo.listNotificationsByUser(userId, unreadOnly);
  }

  markRead(id: string): Promise<void> {
    return this.repo.markNotificationRead(id);
  }
}
