import type {
  AuthResponse,
  CreateWishInput,
  DecisionInput,
  Notification,
  PurchaseDecision,
  Wish,
  WishView,
} from '@patiently/shared';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000';
const TOKEN_KEY = 'patiently.token';

interface SearchNowResponse {
  view: WishView;
}

/**
 * Typed client for the Patiently middleware API. All domain types come from
 * `@patiently/shared`, so the client is checked against the same contract the
 * server implements. A React Native app can reuse this file verbatim.
 */
export class ApiClient {
  private token: string | null = localStorage.getItem(TOKEN_KEY);

  get isAuthenticated(): boolean {
    return this.token !== null;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (this.token) headers.set('Authorization', `Bearer ${this.token}`);

    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
    if (res.status === 401) {
      this.setToken(null);
      throw new Error('Your session expired — please sign in again.');
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Request failed (${res.status})`);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }

  async login(email: string, name?: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
    this.setToken(res.token);
    return res;
  }

  logout(): void {
    this.setToken(null);
  }

  listWishes(): Promise<WishView[]> {
    return this.request<WishView[]>('/api/wishes');
  }

  createWish(input: CreateWishInput): Promise<WishView> {
    return this.request<WishView>('/api/wishes', { method: 'POST', body: JSON.stringify(input) });
  }

  cancelWish(id: string): Promise<Wish> {
    return this.request<Wish>(`/api/wishes/${id}`, { method: 'DELETE' });
  }

  /** Run the daily search immediately for one wish; returns the refreshed view. */
  searchNow(id: string): Promise<SearchNowResponse> {
    return this.request<SearchNowResponse>(`/api/wishes/${id}/search`, { method: 'POST' });
  }

  decide(id: string, input: DecisionInput): Promise<PurchaseDecision> {
    return this.request<PurchaseDecision>(`/api/wishes/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  listNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/api/notifications');
  }

  markNotificationRead(id: string): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' });
  }
}

export const api = new ApiClient();
