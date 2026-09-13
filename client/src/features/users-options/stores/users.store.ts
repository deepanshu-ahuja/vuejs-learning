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
// defineStore declares a store; calling useUsersStore/useUsersCompositionStore
// obtains its instance for this app. The two ids keep the learning routes' state
// independent even though both implementations use the same backend users.
export const useUsersStore = defineStore('users-options', {
  state: () => ({
    users: [] as User[],
    loading: false,
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
        // Cancelling an old search is expected, so do not show it as a failure.
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

    /**
     * Save through the API and return its record. The page reloads the list using
     * its current search, so we do not blindly insert a potentially nonmatching user.
     * No catch here: failures go back to the page for field errors/snackbar feedback.
     * The page owns its busy flag because it also coordinates the list refresh.
     * Returning the API Promise lets the page await success or catch a failure.
     */
    async createUser(input: UserInput): Promise<User> {
      this.error = null
      return usersApi.createUser(input)
    },

    /** Updates a user through the API and returns the latest server record. */
    async updateUser(userId: string, input: UserInput): Promise<User> {
      this.error = null
      return usersApi.updateUser(userId, input)
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
