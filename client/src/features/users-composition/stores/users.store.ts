import { ref } from 'vue'
import { defineStore } from 'pinia'

// These modules are plain TypeScript. They do not depend on Options API, so
// reusing them keeps this comparison focused on Vue/Pinia syntax rather than
// duplicating HTTP and domain contracts.
import * as usersApi from '@/features/users-options/api/users.api'
import type { User, UserInput } from '@/features/users-options/types/user'

/**
 * Composition/setup-style Pinia store.
 *
 * Compare this with the Option Store in `users-options/stores/users.store.ts`:
 * - `state: () => ({ ... })` becomes refs.
 * - `actions: { ... }` becomes ordinary functions.
 * - returned refs/functions become the store's public API.
 */
// defineStore declares a store; calling useUsersStore/useUsersCompositionStore
// obtains its instance for this app. The two ids keep the learning routes' state
// independent even though both implementations use the same backend users.
export const useUsersCompositionStore = defineStore('users-composition', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const deleting = ref(false)
  const error = ref<string | null>(null)

  // This value is intentionally NOT a ref. Nothing in the template renders it,
  // so making a browser AbortController reactive would add no value.
  let usersRequestController: AbortController | null = null

  /**
   * Fetch users from the server, optionally applying backend search.
   *
   * Debounce (in the page) prevents starting a request for every keystroke.
   * AbortController solves a different problem: it cancels an older request
   * that has already started so stale results cannot overwrite newer results.
   */
  async function fetchUsers(search: string | null = ''): Promise<void> {
    usersRequestController?.abort()

    const controller = new AbortController()
    usersRequestController = controller

    loading.value = true
    error.value = null

    try {
      users.value = await usersApi.getUsers(search, controller.signal)
    } catch (caughtError: unknown) {
      // Cancelling an old search is expected, so do not show it as a failure.
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
        return
      }

      error.value = caughtError instanceof Error
        ? caughtError.message
        : 'Unable to load users.'
    } finally {
      // An older aborted request must not turn loading off while a newer request
      // is still running. Only the latest controller owns the loading flag.
      if (usersRequestController === controller) {
        loading.value = false
        usersRequestController = null
      }
    }
  }

  /**
   * Save through the API and return its record. The page reloads the list using
   * its current search, so we do not blindly insert a potentially nonmatching user.
   * No catch here: failures go back to the page for field errors/snackbar feedback.
   * The page owns its busy flag because it also coordinates the list refresh.
   * Returning the API Promise lets the page await success or catch a failure.
   */
  async function createUser(input: UserInput): Promise<User> {
    error.value = null
    return usersApi.createUser(input)
  }

  /** Update one existing user. */
  async function updateUser(userId: string, input: UserInput): Promise<User> {
    error.value = null
    return usersApi.updateUser(userId, input)
  }

  /** Delete one existing user. */
  async function deleteUser(userId: string): Promise<void> {
    deleting.value = true
    error.value = null

    try {
      await usersApi.deleteUser(userId)
    } finally {
      deleting.value = false
    }
  }

  // Setup stores expose only what they return. `usersRequestController` stays
  // private because components have no reason to manipulate request internals.
  return {
    users,
    loading,
    deleting,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  }
})
