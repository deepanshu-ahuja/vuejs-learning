import { apiRequest } from '@/api/apiClient'
import type { User, UserInput } from '../types/user'

/**
 * Fetches users, optionally filtering on the server.
 *
 * `URLSearchParams` handles query-string escaping for us. Passing an
 * AbortSignal connects this request to AbortController so an older search can
 * be cancelled when the user types a newer search.
 */
export function getUsers(search: string | null = '', signal?: AbortSignal): Promise<User[]> {
  const query = new URLSearchParams()
  // A clearable Vuetify field can emit null. `?.` skips trim for null/undefined;
  // `??` then supplies ''. An empty search means fetch the unfiltered list.
  const normalizedSearch = search?.trim() ?? ''

  if (normalizedSearch) {
    query.set('search', normalizedSearch)
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : ''

  return apiRequest<User[]>(`/users${suffix}`, { signal })
}

/** Creates one user and returns the server-created record. */
export function createUser(input: UserInput): Promise<User> {
  return apiRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** Updates one existing user and returns the updated server record. */
export function updateUser(userId: string, input: UserInput): Promise<User> {
  return apiRequest<User>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

/** Deletes one user. The API responds with 204 No Content on success. */
export function deleteUser(userId: string): Promise<void> {
  return apiRequest<void>(`/users/${userId}`, {
    method: 'DELETE',
  })
}
