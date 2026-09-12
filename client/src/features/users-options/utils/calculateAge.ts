/**
 * Calculates age from a YYYY-MM-DD date-of-birth string.
 *
 * This is a plain utility rather than a composable because it has no Vue
 * reactivity, lifecycle, refs, or component state.
 */
export function calculateAge(dateOfBirth: string, today = new Date()): number {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`)
  let age = today.getFullYear() - birthDate.getFullYear()

  const birthdayHasNotOccurredYet =
    today.getMonth() < birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())

  if (birthdayHasNotOccurredYet) {
    age -= 1
  }

  return age
}
