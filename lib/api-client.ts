/**
 * Client-side wrapper around fetch() for our own JSON API.
 *
 * Why: every state-changing route requires the `x-vb-client: web` header
 * (see lib/csrf.ts). Centralising this keeps every form/component honest.
 */

export interface ApiPostOptions {
  signal?: AbortSignal
  authToken?: string | null
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  options: ApiPostOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-vb-client': 'web',
  }
  if (options.authToken) headers['Authorization'] = `Bearer ${options.authToken}`

  const response = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: options.signal,
    credentials: 'same-origin',
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    /* response had no JSON body */
  }

  if (!response.ok) {
    const errorPayload = data as { error?: string; message?: string } | null
    const message =
      errorPayload?.error ?? errorPayload?.message ?? `Request failed (${response.status})`
    throw new Error(message)
  }
  return data as T
}
