import { apiRequest } from '@/api/apiClient'
import type { User, UserInput } from '../types/user'

/** Fetches the current list of users from the backend. */
export function getUsers(): Promise<User[]> {
  return apiRequest<User[]>('/users')
}

/** Creates one user and returns the server-created record. */
export function createUser(input: UserInput): Promise<User> {
  return apiRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
