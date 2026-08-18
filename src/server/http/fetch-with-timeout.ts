/**
 * Minimal, dependency-free server-side HTTP client wrapper.
 *
 * - Enforces a timeout via AbortController.
 * - Enforces a maximum response size (protects against unexpectedly large
 *   upstream payloads).
 * - Normalizes failures into typed errors so callers (route handlers) can map
 *   them to safe, generic HTTP responses without ever leaking stack traces
 *   or upstream internals to the client.
 *
 * This module must only be imported from server-side code (`src/server/**`).
 * It is never bundled into the client.
 */

export class HttpTimeoutError extends Error {
  constructor(message = 'Upstream request timed out') {
    super(message);
    this.name = 'HttpTimeoutError';
  }
}

export class HttpStatusError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpStatusError';
    this.status = status;
  }
}

export class HttpInvalidResponseError extends Error {
  constructor(message = 'Upstream response was invalid or unexpected') {
    super(message);
    this.name = 'HttpInvalidResponseError';
  }
}

interface FetchJsonWithTimeoutOptions {
  /** Abort the request after this many milliseconds. */
  timeoutMs: number;
  /** Reject responses larger than this many bytes (approximate, based on text length). */
  maxResponseBytes?: number;
  headers?: Record<string, string>;
}

/**
 * Fetches a URL, parses the body as JSON, and validates it with the given
 * `validate` function before returning. `validate` should throw or return a
 * typed value; any thrown error is treated as an invalid-response failure.
 */
export async function fetchJsonWithTimeout<T>(
  url: string,
  options: FetchJsonWithTimeoutOptions,
  validate: (data: unknown) => T,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: options.headers,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpTimeoutError();
      }
      throw new HttpInvalidResponseError('Failed to reach upstream service');
    }

    if (!response.ok) {
      throw new HttpStatusError(`Upstream responded with status ${response.status}`, response.status);
    }

    const contentLength = response.headers.get('content-length');
    if (options.maxResponseBytes && contentLength && Number(contentLength) > options.maxResponseBytes) {
      throw new HttpInvalidResponseError('Upstream response exceeds the allowed size');
    }

    const text = await response.text();
    if (options.maxResponseBytes && text.length > options.maxResponseBytes) {
      throw new HttpInvalidResponseError('Upstream response exceeds the allowed size');
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new HttpInvalidResponseError('Upstream response is not valid JSON');
    }

    try {
      return validate(data);
    } catch {
      throw new HttpInvalidResponseError('Upstream response does not match the expected structure');
    }
  } finally {
    clearTimeout(timer);
  }
}
