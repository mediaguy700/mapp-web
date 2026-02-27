/**
 * Auth API client - same base URL as BLE API, x-api-key on every request,
 * Authorization: Bearer for /auth/me and /auth/logout.
 */

const BASE = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_BLE_API_URL ?? 'https://rkali63t89.execute-api.us-east-2.amazonaws.com/Prod').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_BLE_API_KEY ?? 'MlzzVbn4og1AN93aBra5pa9OTKZs716j35uFuV1I';
const TOKEN_KEY = 'intramap-token';

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem('intramap-loggedin', '1');
}

export function clearAuth(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem('intramap-loggedin');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function authRequest<T>(
  endpoint: string,
  options: { method?: string; body?: object; headers?: HeadersInit } = {}
): Promise<T> {
  const { body, method = 'GET', headers: optHeaders } = options;
  const url = `${BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: HeadersInit = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
    ...(optHeaders as Record<string, string>),
  };
  const token = getToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error((err as { error?: string }).error ?? `Auth error: ${response.status}`);
  }
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Login request body - matches API: {"username": "...", "password": "..."} */
const loginBody = (username: string, password: string) => ({ username, password });

/** Login response - API returns token, user, expires_at */
type LoginResponse = { token?: string; access_token?: string; user?: object; expires_at?: string };

export const authApi = {
  login: (username: string, password: string) =>
    authRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: loginBody(username, password),
    }),

  register: (username: string, password: string, email?: string) =>
    authRequest<{ token?: string }>('/auth/register', {
      method: 'POST',
      body: { username, password, ...(email && { email }) },
    }),

  me: () =>
    authRequest<{ user: { id: string; username: string; email?: string; created_at?: string } }>('/auth/me', {
      method: 'GET',
    }),

  logout: () =>
    authRequest('/auth/logout', { method: 'POST' }),

  passwordResetRequest: (emailOrUsername: string) =>
    authRequest('/auth/password-reset/request', {
      method: 'POST',
      body: /@/.test(emailOrUsername) ? { email: emailOrUsername } : { username: emailOrUsername },
    }),

  passwordResetConfirm: (token: string, newPassword: string) =>
    authRequest('/auth/password-reset/confirm', {
      method: 'POST',
      body: { token, new_password: newPassword },
    }),
};
