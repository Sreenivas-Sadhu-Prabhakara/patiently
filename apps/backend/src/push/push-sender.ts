import { createSign } from 'node:crypto';
import type { BackendConfig } from '../config/env.js';

export interface PushMessage {
  title: string;
  body: string;
  /** Arbitrary string key/values delivered to the client (e.g. wishId, type). */
  data?: Record<string, string>;
}

/**
 * Sends push notifications to a set of device tokens. The seam that turns an
 * in-app `approval_needed` notification into the buzz on the user's phone.
 */
export interface PushSender {
  readonly name: string;
  send(tokens: string[], message: PushMessage): Promise<void>;
}

/** Default sender: logs instead of sending. Used until FCM creds are provided. */
export class LogPushSender implements PushSender {
  readonly name = 'log';
  async send(tokens: string[], message: PushMessage): Promise<void> {
    if (tokens.length === 0) return;
    console.log(`[push:log] → ${tokens.length} device(s): "${message.title}" — ${message.body}`);
  }
}

const base64url = (input: Buffer | string): string => Buffer.from(input).toString('base64url');

/**
 * Real sender via Firebase Cloud Messaging HTTP v1. Active only when the
 * FIREBASE_* service-account credentials are set; authenticates with an RS256
 * JWT exchanged for an OAuth access token. Docs:
 * https://firebase.google.com/docs/cloud-messaging/migrate-v1
 */
export class FcmPushSender implements PushSender {
  readonly name = 'fcm';
  private token: { value: string; expiresAt: number } | null = null;

  constructor(private readonly config: BackendConfig) {}

  static isConfigured(config: BackendConfig): boolean {
    return Boolean(
      config.FIREBASE_PROJECT_ID && config.FIREBASE_CLIENT_EMAIL && config.FIREBASE_PRIVATE_KEY,
    );
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;

    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = base64url(
      JSON.stringify({
        iss: this.config.FIREBASE_CLIENT_EMAIL,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      }),
    );
    const privateKey = (this.config.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
    const signature = createSign('RSA-SHA256')
      .update(`${header}.${claim}`)
      .sign(privateKey, 'base64url');
    const assertion = `${header}.${claim}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
    if (!res.ok) throw new Error(`FCM token exchange failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
    return this.token.value;
  }

  async send(tokens: string[], message: PushMessage): Promise<void> {
    if (tokens.length === 0) return;
    const accessToken = await this.accessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${this.config.FIREBASE_PROJECT_ID}/messages:send`;

    await Promise.all(
      tokens.map(async (token) => {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title: message.title, body: message.body },
              ...(message.data ? { data: message.data } : {}),
            },
          }),
        });
        if (!res.ok) {
          console.error(`[push:fcm] send failed (${res.status}) for token …${token.slice(-8)}`);
        }
      }),
    );
  }
}

/** Pick the configured sender: FCM when credentials exist, else the log sender. */
export function buildPushSender(config: BackendConfig): PushSender {
  return FcmPushSender.isConfigured(config) ? new FcmPushSender(config) : new LogPushSender();
}
