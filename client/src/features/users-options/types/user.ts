/** Roles accepted by both the form and the backend. */
export type UserRole = 'admin' | 'developer' | 'viewer'

export type UserStatus = 'active' | 'inactive'

/** User as returned by the API. */
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  dateOfBirth: string
  bio: string
  createdAt: string
  updatedAt: string
}

/**
 * Data required to create/update a user.
 *
 * `id`, `createdAt`, and `updatedAt` are intentionally absent because those
 * values are generated/owned by the server rather than entered in the form.
 */
export interface UserInput {
  name: string
  email: string
  role: UserRole
  status: UserStatus
  dateOfBirth: string
  bio: string
}
