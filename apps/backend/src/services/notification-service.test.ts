import { describe, expect, it } from 'vitest';
import type { DeviceToken, Notification } from '@patiently/shared';
import type { Repository } from '../repository/repository.js';
import type { PushMessage, PushSender } from '../push/push-sender.js';
import { NotificationService } from './notification-service.js';

/** Minimal fake repo exposing only what NotificationService touches. */
function fakeRepo(devices: DeviceToken[]): Repository {
  const notifications: Notification[] = [];
  return {
    addNotification: async (n: Notification) => {
      notifications.push(n);
      return n;
    },
    listDeviceTokensByUser: async (userId: string) => devices.filter((d) => d.userId === userId),
    listNotificationsByUser: async () => notifications,
    markNotificationRead: async () => {},
  } as unknown as Repository;
}

class CapturingPush implements PushSender {
  readonly name = 'capturing';
  calls: { tokens: string[]; message: PushMessage }[] = [];
  async send(tokens: string[], message: PushMessage): Promise<void> {
    this.calls.push({ tokens, message });
  }
}

function device(userId: string, token: string): DeviceToken {
  return {
    id: token,
    userId,
    token,
    platform: 'android',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('NotificationService push fan-out', () => {
  it('pushes to all of the user’s device tokens with type + wishId data', async () => {
    const push = new CapturingPush();
    const service = new NotificationService(
      fakeRepo([device('u1', 'tokA'), device('u1', 'tokB'), device('u2', 'other')]),
      push,
    );

    await service.notify({
      userId: 'u1',
      wishId: 'w1',
      type: 'approval_needed',
      title: 'Ready to buy',
      body: '₹281.50 from Flipkart',
    });

    expect(push.calls).toHaveLength(1);
    expect(push.calls[0]!.tokens).toEqual(['tokA', 'tokB']);
    expect(push.calls[0]!.message.title).toBe('Ready to buy');
    expect(push.calls[0]!.message.data).toEqual({ type: 'approval_needed', wishId: 'w1' });
  });

  it('does not push when the user has no registered devices', async () => {
    const push = new CapturingPush();
    const service = new NotificationService(fakeRepo([]), push);
    await service.notify({ userId: 'u1', type: 'purchased', title: 'Done', body: 'Ordered' });
    expect(push.calls).toHaveLength(0);
  });
});
