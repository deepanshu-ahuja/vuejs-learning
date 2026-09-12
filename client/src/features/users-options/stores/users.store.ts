import { defineStore } from 'pinia'
import * as usersApi from '../api/users.api'
import type { User, UserInput } from '../types/user'

/**
 * Shared server-backed state for the Options API user feature.
 *
 * We intentionally keep things such as "is the create dialog open?" out of
 * this store because that state belongs only to the component displaying it.
 */
export const useUsersStore = defineStore('users-options', {
  state: () => ({
    users: [] as User[],
    loading: false,
    saving: false,
    error: null as string | null,
  }),

  actions: {
    /** Loads users from the backend into shared Pinia state. */
    async fetchUsers(): Promise<void> {
      this.loading = true
      this.error = null

      try {
        this.users = await usersApi.getUsers()
      } catch (error: unknown) {
        // `catch` values are `unknown` in safe TypeScript. We narrow the value
        // before reading `.message` instead of assuming every thrown value is
        // an Error object.
        this.error = error instanceof Error ? error.message : 'Unable to load users.'
      } finally {
        this.loading = false
      }
    },

    /**
     * Creates a user through the API and immediately adds the returned record
     * to Pinia state so the list can update without a second full fetch.
     */
    async createUser(input: UserInput): Promise<User> {
      this.saving = true
      this.error = null

      try {
        const createdUser = await usersApi.createUser(input)
        this.users.unshift(createdUser)
        return createdUser
      } finally {
        this.saving = false
      }
    },
  },
})
