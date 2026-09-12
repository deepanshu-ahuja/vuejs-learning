const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'

/**
 * Small HTTP helper used by feature API modules.
 *
 * Keeping `fetch` details here prevents Vue components and Pinia stores from
 * repeatedly rebuilding URLs and response parsing logic.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    // The server will later return richer field-level validation errors. For
    // now, preserve a useful message rather than silently returning bad data.
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  // `T` is a TypeScript generic. It lets the caller describe the expected
  // response shape, for example `apiRequest<User[]>('/users')`.
  return response.json() as Promise<T>
}
