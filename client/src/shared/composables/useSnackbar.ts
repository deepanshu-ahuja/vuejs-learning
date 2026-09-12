import { reactive } from 'vue'

export type SnackbarColor = 'success' | 'error' | 'info' | 'warning'

/**
 * Reusable LOCAL snackbar state/logic.
 *
 * Every call creates a new reactive object, so this is not a global notification
 * system. That distinction is important: reusable logic does not automatically
 * mean shared/global state.
 */
export function useSnackbar() {
  const snackbar = reactive({
    open: false,
    message: '',
    color: 'success' as SnackbarColor,
  })

  /** Show temporary feedback using the shared AppSnackbar presentation. */
  function showSnackbar(message: string, color: SnackbarColor = 'success'): void {
    snackbar.message = message
    snackbar.color = color
    snackbar.open = true
  }

  return {
    snackbar,
    showSnackbar,
  }
}
