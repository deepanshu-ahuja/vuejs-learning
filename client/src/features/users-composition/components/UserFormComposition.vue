<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'

import type { ApiFieldErrors } from '@/api/apiClient'
import type {
  UserInput,
  UserRole,
  UserStatus,
} from '@/features/users-options/types/user'

/**
 * A Vuetify rule returns `true` when valid, otherwise the text Vuetify should
 * render as the validation error for that field.
 */
type ValidationRule<T> = (value: T) => true | string

type UserFormProps = {
  initialValue?: UserInput | null
  submitting?: boolean
  fieldErrors?: ApiFieldErrors
  submitLabel?: string
}

/*
 * `defineProps()` is a compiler macro available inside <script setup>.
 * `withDefaults()` supplies runtime defaults while TypeScript still checks the
 * prop contract from `UserFormProps`.
 */
const props = withDefaults(defineProps<UserFormProps>(), {
  initialValue: null,
  submitting: false,
  fieldErrors: () => ({}),
  submitLabel: 'Save user',
})

/*
 * The tuple syntax documents each emitted event and its payload type.
 * For example, `submit: [input: UserInput]` means emit('submit', value) must
 * receive a UserInput object.
 */
const emit = defineEmits<{
  submit: [input: UserInput]
  'clear-field-error': [fieldName: keyof UserInput]
}>()

type FormRef = {
  validate: () => Promise<{ valid: boolean }>
  resetValidation: () => void
}

function createEmptyForm(): UserInput {
  return {
    name: '',
    email: '',
    role: 'developer',
    status: 'active',
    dateOfBirth: '',
    bio: '',
  }
}

function createFormValue(value: UserInput | null | undefined): UserInput {
  return value ? { ...value } : createEmptyForm()
}

/*
 * reactive() lets Vue track writes such as form.name = 'Alice' and update UI
 * that reads them. This is a separate draft so typing does not change the
 * parent's saved user. Pinia holds saved records; this component owns its draft.
 * Access reactive fields directly in script and template. A ref uses .value in
 * script, but Vue also unwraps top-level refs automatically in templates.
 */
const form = reactive<UserInput>(createFormValue(props.initialValue))

// A template ref starts as null because the VForm does not exist until render.
const formRef = ref<FormRef | null>(null)
// Vuetify validation returns a Promise, so another submit could arrive
// while we await the result. Set this flag before awaiting to ignore it.
// It belongs to this form because only this form runs these checks.
const validating = ref(false)

const roles: Array<{ title: string; value: UserRole }> = [
  { title: 'Admin', value: 'admin' },
  { title: 'Developer', value: 'developer' },
  { title: 'Viewer', value: 'viewer' },
]

const statuses: Array<{ title: string; value: UserStatus }> = [
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
]

const nameRules = computed<ValidationRule<string>[]>(() => [
  (value) => Boolean(value.trim()) || 'Name is required.',
  (value) => value.trim().length >= 2 || 'Name must be at least 2 characters.',
])

const bioRules: ValidationRule<string>[] = [
  (value) => value.length <= 300 || 'Bio cannot exceed 300 characters.',
]

const emailRules = computed<ValidationRule<string>[]>(() => [
  (value) => Boolean(value.trim()) || 'Email is required.',
  (value) => /^\S+@\S+\.\S+$/.test(value) || 'Enter a valid email address.',
])

const dateOfBirthRules = computed<ValidationRule<string>[]>(() => [
  (value) => Boolean(value) || 'Date of birth is required.',
  (value) => {
    const selectedDate = new Date(`${value}T00:00:00`)
    return selectedDate <= new Date() || 'Date of birth cannot be in the future.'
  },
])

/**
 * Watches the parent's initialValue prop, NOT typing in the local form.
 * Example: if a mounted Edit form receives Bob after Alice, copy Bob's fields
 * into the draft and clear the old validation. Initial setup runs only once.
 * The first argument, () => props.initialValue, tells Vue what value to observe;
 * the second function runs when that value is replaced (not on nested edits).
 * Object.assign changes fields on the existing reactive object so Vue keeps
 * tracking that same object. A null prop restores the Create defaults.
 */
watch(
  () => props.initialValue,
  (value) => {
    Object.assign(form, createFormValue(value))
    formRef.value?.resetValidation()
  },
)

/** Validate locally before giving the parent a clean copy of the form data. */
async function submitForm(): Promise<void> {
  if (!formRef.value || props.submitting || validating.value) return
  validating.value = true

  try {
    const { valid } = await formRef.value.validate()
    if (!valid || props.submitting) return

    emit('submit', { ...form })
    // emit calls the page handler, which sets creating or editing to true.
    // Vue batches component updates: this form receives submitting=true
    // when the parent updates, not immediately when its busy flag changes.
    // nextTick waits for that Vue update (it does NOT wait for the API).
    // Only then release validating, so submitting can keep blocking saves.
    await nextTick()
  } finally {
    validating.value = false
  }
}

/** Reset form values and Vuetify validation messages. */
function resetForm(): void {
  Object.assign(form, createEmptyForm())
  // Backend errors belong to the parent; reset requests their removal too.
  // Object.keys is typed as string[]. This assertion tells TypeScript these
  // keys come from UserInput, so each is a valid clear-field-error payload.
  for (const field of Object.keys(createEmptyForm()) as Array<keyof UserInput>) {
    emit('clear-field-error', field)
  }
  formRef.value?.resetValidation()
}

/*
 * <script setup> components are private by default when accessed through a
 * parent template ref. `defineExpose()` deliberately makes resetForm public so
 * the parent can clear the Create form after a successful API request.
 */
defineExpose({ resetForm })
</script>

<template>
  <!--
    @submit listens to a form submission (Save click or Enter). .prevent stops
    the browser's normal page reload; submitForm validates and notifies the page.
    ref="formRef" gives the script access to this VForm's validation methods.
  -->
  <VForm ref="formRef" @submit.prevent="submitForm">
    <!--
      v-model="form.name" passes :model-value="form.name" and listens for
      @update:model-value to assign the emitted text back to form.name.
      Our extra listener asks the parent to remove any old server error as the
      user corrects the field. `:` binds a JavaScript value; `@` listens to events.
      error-messages receives an array with the server error, or [] if none.
    -->
    <VTextField
      v-model="form.name"
      label="Name"
      :rules="nameRules"
      :error-messages="fieldErrors.name ? [fieldErrors.name] : []"
      autocomplete="name"
      @update:model-value="emit('clear-field-error', 'name')"
    />

    <VTextField
      v-model="form.email"
      label="Email"
      type="email"
      :rules="emailRules"
      :error-messages="fieldErrors.email ? [fieldErrors.email] : []"
      autocomplete="email"
      @update:model-value="emit('clear-field-error', 'email')"
    />

    <!-- Show the item's title ('Admin'), but save its value ('admin') in form.role. -->
    <VSelect
      v-model="form.role"
      label="Role"
      class="mt-2"
      :items="roles"
      item-title="title"
      item-value="value"
      :error-messages="fieldErrors.role ? [fieldErrors.role] : []"
      @update:model-value="emit('clear-field-error', 'role')"
    />

    <VSelect
      v-model="form.status"
      label="Status"
      :items="statuses"
      item-title="title"
      item-value="value"
      :error-messages="fieldErrors.status ? [fieldErrors.status] : []"
      @update:model-value="emit('clear-field-error', 'status')"
    />

    <VTextField
      v-model="form.dateOfBirth"
      label="Date of birth"
      type="date"
      :rules="dateOfBirthRules"
      :error-messages="fieldErrors.dateOfBirth ? [fieldErrors.dateOfBirth] : []"
      @update:model-value="emit('clear-field-error', 'dateOfBirth')"
    />

    <!-- counter displays the length; maxlength limits entry. The rule also
         checks draft values supplied in code. The API enforces its own limit. -->
    <VTextarea
      v-model="form.bio"
      label="Bio"
      rows="3"
      counter="300"
      maxlength="300"
      :rules="bioRules"
      :error-messages="fieldErrors.bio ? [fieldErrors.bio] : []"
      @update:model-value="emit('clear-field-error', 'bio')"
    />

    <div class="d-flex ga-3 mt-4">
      <VBtn
        color="primary"
        type="submit"
        :loading="submitting"
        :disabled="submitting || validating"
      >
        {{ submitLabel }}
      </VBtn>

      <VBtn
        variant="outlined"
        type="button"
        :disabled="submitting"
        @click="resetForm"
      >
        Reset
      </VBtn>
    </div>
  </VForm>
</template>
