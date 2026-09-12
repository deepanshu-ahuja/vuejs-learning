const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'

/**
 * Structured error shape returned by our tiny API for field-level validation.
 * The index signature means the backend can return errors keyed by field name,
 * for example `{ email: 'Email already exists.' }`.
 */
export type ApiFieldErrors = Record<string, string>

/**
 * Error thrown for non-2xx HTTP responses.
 *
 * A normal `Error` only gives us a message. This subclass also preserves the
 * HTTP status and optional field errors so a Vue form can show backend
 * validation next to the correct field instead of only displaying a toast.
 */
export class ApiError extends Error {
  status: number
  fieldErrors: ApiFieldErrors

  constructor(message: string, status: number, fieldErrors: ApiFieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

interface ApiErrorBody {
  message?: string
  fieldErrors?: ApiFieldErrors
}

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
    let errorBody: ApiErrorBody = {}

    try {
      errorBody = (await response.json()) as ApiErrorBody
    } catch {
      // Some servers may return plain text/HTML for an unexpected failure.
      // Falling back keeps the client useful even when the response body is
      // not the JSON shape our own API normally returns.
    }

    throw new ApiError(
      errorBody.message ?? `Request failed with status ${response.status}`,
      response.status,
      errorBody.fieldErrors,
    )
  }

  // DELETE can legitimately return 204 No Content. Calling response.json()
  // on an empty body would throw, so return `undefined` for that one case.
  if (response.status === 204) {
    return undefined as T
  }

  // `T` is a TypeScript generic. It lets the caller describe the expected
  // response shape, for example `apiRequest<User[]>('/users')`.
  return response.json() as Promise<T>
}
