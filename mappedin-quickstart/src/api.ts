// BLE API: use env or defaults. In dev, proxy /api to BLE_API_URL
const BASE_URL =
  import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_BLE_API_URL ?? 'https://rkali63t89.execute-api.us-east-2.amazonaws.com/Prod');
const API_KEY = import.meta.env.VITE_BLE_API_KEY ?? import.meta.env.VITE_API_KEY ?? 'MlzzVbn4og1AN93aBra5pa9OTKZs716j35uFuV1I';

const defaultHeaders: HeadersInit = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json',
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
