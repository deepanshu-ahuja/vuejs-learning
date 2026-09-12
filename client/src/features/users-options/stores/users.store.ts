import { defineStore } from 'pinia'
import * as usersApi from '../api/users.api'
import type { User, UserInput } from '../types/user'

/*
 * AbortController does not need to be reactive Vue state. Keeping the current
 * request controller outside the store state avoids proxying a browser API
 * object while still letting the singleton Pinia store cancel stale searches.
 */
let usersRequestController: AbortController | null = null

/**
 * Shared server-backed state for the Options API user feature.
 *
 * We intentionally keep things such as "is the details dialog open?" out of
 * this store because that state belongs only to the component displaying it.
 */
export const useUsersStore = defineStore('users-options', {
  state: () => ({
    users: [] as User[],
    loading: false,
    saving: false,
    deleting: false,
    error: null as string | null,
  }),

  actions: {
    /**
     * Loads users from the backend into shared Pinia state.
     *
     * A newer search aborts the previous request. Without this, a slow response
     * for "al" could arrive after a faster response for "alex" and overwrite
     * the screen with stale results.
     */
    async fetchUsers(search: string | null = ''): Promise<void> {
      usersRequestController?.abort()
      const controller = new AbortController()
      usersRequestController = controller

      this.loading = true
      this.error = null

      try {
        this.users = await usersApi.getUsers(search, controller.signal)
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        this.error = error instanceof Error ? error.message : 'Unable to load users.'
      } finally {
        // Only the latest request owns the meaningful loading state. An aborted
        // older request must not switch loading off while a newer one is active.
        if (usersRequestController === controller) {
          this.loading = false
          usersRequestController = null
        }
      }
    },

    /** Creates a user through the API and returns the server-created record. */
    async createUser(input: UserInput): Promise<User> {
      this.saving = true
      this.error = null

      try {
        return await usersApi.createUser(input)
      } finally {
        this.saving = false
      }
    },

    /** Updates a user through the API and returns the latest server record. */
    async updateUser(userId: string, input: UserInput): Promise<User> {
      this.saving = true
      this.error = null

      try {
        return await usersApi.updateUser(userId, input)
      } finally {
        this.saving = false
      }
    },

    /** Deletes a user through the API. */
    async deleteUser(userId: string): Promise<void> {
      this.deleting = true
      this.error = null

      try {
        await usersApi.deleteUser(userId)
      } finally {
        this.deleting = false
      }
    },
  },
})
