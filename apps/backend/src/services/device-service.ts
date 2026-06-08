import { randomUUID } from 'node:crypto';
import { RegisterDeviceInput, type DeviceToken } from '@patiently/shared';
import type { Repository } from '../repository/repository.js';

/** Registers and removes the push-notification device tokens for a user. */
export class DeviceService {
  constructor(private readonly repo: Repository) {}

  async register(userId: string, raw: unknown): Promise<DeviceToken> {
    const input: RegisterDeviceInput = RegisterDeviceInput.parse(raw);
    return this.repo.upsertDeviceToken({
      id: randomUUID(),
      userId,
      token: input.token,
      platform: input.platform,
      createdAt: new Date().toISOString(),
    });
  }

  unregister(token: string): Promise<void> {
    return this.repo.removeDeviceToken(token);
  }

  list(userId: string): Promise<DeviceToken[]> {
    return this.repo.listDeviceTokensByUser(userId);
  }
}
