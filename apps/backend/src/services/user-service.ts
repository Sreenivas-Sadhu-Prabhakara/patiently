import { randomUUID } from 'node:crypto';
import { LoginInput, type User } from '@patiently/shared';
import type { Repository } from '../repository/repository.js';

/**
 * Minimal identity for the MVP: passwordless find-or-create by email. The
 * middleware wraps the returned user in a signed JWT. Swap for a real IdP
 * (magic links / OAuth / passkeys) without touching the rest of the domain.
 */
export class UserService {
  constructor(private readonly repo: Repository) {}

  async loginOrCreate(raw: unknown): Promise<User> {
    const input: LoginInput = LoginInput.parse(raw);
    const existing = await this.repo.getUserByEmail(input.email);
    if (existing) return existing;

    const user: User = {
      id: randomUUID(),
      email: input.email,
      name: input.name ?? input.email.split('@')[0]!,
      createdAt: new Date().toISOString(),
    };
    return this.repo.createUser(user);
  }

  getUser(id: string): Promise<User | null> {
    return this.repo.getUser(id);
  }
}
