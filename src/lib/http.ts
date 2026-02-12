export interface HttpOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  formBody?: Record<string, string | string[]>;
  timeout?: number;
}

export interface ApiError {
  code: string;
  message: string;
  retry_after?: number;
}

const BASE_URL = 'https://api.bufferapp.com/1';

/**
 * Builds a full Buffer API URL with the access token as a query parameter.
 */
export function buildUrl(path: string, token: string, params?: Record<string, string>): string {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('access_token', token);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

/**
 * Encodes a record into application/x-www-form-urlencoded body.
 * Supports array values via key[] notation (used by Buffer for profile_ids[]).
 */
function encodeFormBody(data: Record<string, string | string[]>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.join('&');
}

/**
 * Makes an HTTP request to the Buffer API with standard error handling.
 */
export async function request<T>(url: string, options: HttpOptions = {}): Promise<T> {
  const { method = 'GET', headers = {}, body, formBody, timeout = 30_000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const fetchHeaders: Record<string, string> = { ...headers };
    let fetchBody: string | undefined;

    if (formBody) {
      fetchHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      fetchBody = encodeFormBody(formBody);
    } else if (body) {
      fetchHeaders['Content-Type'] = 'application/json';
      fetchBody = JSON.stringify(body);
    }

    const response = await fetch(url, {
      method,
      headers: fetchHeaders,
      body: fetchBody,
      signal: controller.signal,
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      throw new HttpError(
        'Rate limit exceeded. Buffer allows 60 requests per minute.',
        'RATE_LIMITED',
        429,
        retryAfter ? parseInt(retryAfter) : 60,
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new HttpError(
        'Authentication failed. Check your access token or run: buffer auth login',
        'AUTH_FAILED',
        response.status,
      );
    }

    if (!response.ok) {
      const text = await response.text();
      let message = `HTTP ${response.status}`;
      try {
        const json = JSON.parse(text);
        message = json.error ?? json.message ?? text;
      } catch {
        message = text || message;
      }
      throw new HttpError(message, 'API_ERROR', response.status);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export class HttpError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Retries a function with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries) break;
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
