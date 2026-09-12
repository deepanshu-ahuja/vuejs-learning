<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

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
 * `reactive()` is convenient for one form object whose fields are mutated in
 * place. Unlike a ref, template code does not need `.value` for this object.
 */
const form = reactive<UserInput>(createFormValue(props.initialValue))

// A template ref starts as null because the VForm does not exist until render.
const formRef = ref<FormRef | null>(null)

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
 * Edit dialogs can stay mounted while the selected user changes. Watching the
 * prop keeps this local editable copy synchronized with the latest selection.
 * `Object.assign` preserves the same reactive proxy instead of replacing it.
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
  if (!formRef.value) return

  const { valid } = await formRef.value.validate()
  if (!valid) return

  emit('submit', { ...form })
}

/** Reset form values and Vuetify validation messages. */
function resetForm(): void {
  Object.assign(form, createEmptyForm())
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
  <VForm ref="formRef" @submit.prevent="submitForm">
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

    <VSelect
      v-model="form.role"
      label="Role"
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

    <VTextarea
      v-model="form.bio"
      label="Bio"
      rows="3"
      counter="300"
      :error-messages="fieldErrors.bio ? [fieldErrors.bio] : []"
      @update:model-value="emit('clear-field-error', 'bio')"
    />

    <div class="d-flex ga-3 mt-4">
      <VBtn
        color="primary"
        type="submit"
        :loading="submitting"
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
