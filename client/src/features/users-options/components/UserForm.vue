<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { UserInput, UserRole, UserStatus } from '../types/user'

type ValidationRule<T> = (value: T) => true | string
type UserFieldErrors = Partial<Record<keyof UserInput, string>>

const createEmptyForm = (): UserInput => ({
  name: '',
  email: '',
  role: 'developer',
  status: 'active',
  dateOfBirth: '',
  bio: '',
})

export default defineComponent({
  name: 'UserForm',

  props: {
    /** Optional existing values let the same form handle Create and Edit. */
    initialValue: {
      type: Object as PropType<UserInput | null>,
      default: null,
    },
    submitting: {
      type: Boolean,
      default: false,
    },
    submitLabel: {
      type: String,
      default: 'Save user',
    },
    /** Backend errors are separate from local Vuetify validation rules. */
    fieldErrors: {
      type: Object as PropType<UserFieldErrors>,
      default: () => ({}),
    },
  },

  emits: ['submit', 'clear-field-error'],

  data() {
    return {
      // Copy the prop. Directly editing a prop object would break Vue's
      // one-way parent -> child data flow.
      form: this.initialValue ? { ...this.initialValue } : createEmptyForm(),

      roles: [
        { title: 'Admin', value: 'admin' as UserRole },
        { title: 'Developer', value: 'developer' as UserRole },
        { title: 'Viewer', value: 'viewer' as UserRole },
      ],
      statuses: [
        { title: 'Active', value: 'active' as UserStatus },
        { title: 'Inactive', value: 'inactive' as UserStatus },
      ],
    }
  },

  computed: {
    nameRules(): ValidationRule<string>[] {
      return [
        (value) => Boolean(value.trim()) || 'Name is required.',
        (value) => value.trim().length >= 2 || 'Name must be at least 2 characters.',
      ]
    },
    emailRules(): ValidationRule<string>[] {
      return [
        (value) => Boolean(value.trim()) || 'Email is required.',
        (value) => /^\S+@\S+\.\S+$/.test(value) || 'Enter a valid email address.',
      ]
    },
    dateOfBirthRules(): ValidationRule<string>[] {
      return [
        (value) => Boolean(value) || 'Date of birth is required.',
        (value) => value <= new Date().toISOString().slice(0, 10) || 'Date of birth cannot be in the future.',
      ]
    },
  },

  watch: {
    /**
     * `data()` runs once per component instance. Watching the prop keeps the
     * local editable copy in sync if the parent selects a different user.
     */
    initialValue(newValue: UserInput | null): void {
      this.form = newValue ? { ...newValue } : createEmptyForm()

      void this.$nextTick(() => {
        const formRef = this.$refs.formRef as { resetValidation?: () => void } | undefined
        formRef?.resetValidation?.()
      })
    },
  },

  methods: {
    /** Validate locally, then emit clean form data to the parent. */
    async submitForm(): Promise<void> {
      // `$refs` contains elements/components marked with `ref="..."`.
      const formRef = this.$refs.formRef as { validate: () => Promise<{ valid: boolean }> }
      const { valid } = await formRef.validate()

      if (!valid) return

      // Emit a copy so the parent/store cannot mutate this local object by reference.
      this.$emit('submit', { ...this.form })
    },

    /** Reset values and Vuetify's validation messages. */
    resetForm(): void {
      this.form = createEmptyForm()
      const formRef = this.$refs.formRef as { resetValidation: () => void }
      formRef.resetValidation()
    },
  },
})
</script>

<template>
  <VForm ref="formRef" @submit.prevent="submitForm">
    <VTextField
      v-model="form.name"
      label="Name"
      :rules="nameRules"
      :error-messages="fieldErrors.name ? [fieldErrors.name] : []"
      autocomplete="name"
      @update:model-value="$emit('clear-field-error', 'name')"
    />

    <VTextField
      v-model="form.email"
      label="Email"
      type="email"
      :rules="emailRules"
      :error-messages="fieldErrors.email ? [fieldErrors.email] : []"
      autocomplete="email"
      @update:model-value="$emit('clear-field-error', 'email')"
    />

    <VSelect
      v-model="form.role"
      label="Role"
      :items="roles"
      item-title="title"
      item-value="value"
      :error-messages="fieldErrors.role ? [fieldErrors.role] : []"
      @update:model-value="$emit('clear-field-error', 'role')"
    />

    <VSelect
      v-model="form.status"
      label="Status"
      :items="statuses"
      item-title="title"
      item-value="value"
      :error-messages="fieldErrors.status ? [fieldErrors.status] : []"
      @update:model-value="$emit('clear-field-error', 'status')"
    />

    <!--
      Using a native date input inside VTextField keeps this exercise focused on
      Vue form/state concepts rather than adding a date-picker interaction just
      because another Vuetify component exists.
    -->
    <VTextField
      v-model="form.dateOfBirth"
      label="Date of birth"
      type="date"
      :rules="dateOfBirthRules"
      :error-messages="fieldErrors.dateOfBirth ? [fieldErrors.dateOfBirth] : []"
      @update:model-value="$emit('clear-field-error', 'dateOfBirth')"
    />

    <VTextarea
      v-model="form.bio"
      label="Bio"
      rows="3"
      counter="300"
      maxlength="300"
      :error-messages="fieldErrors.bio ? [fieldErrors.bio] : []"
      @update:model-value="$emit('clear-field-error', 'bio')"
    />

    <div class="d-flex ga-3 mt-4">
      <VBtn color="primary" type="submit" :loading="submitting">
        {{ submitLabel }}
      </VBtn>
      <VBtn variant="outlined" type="button" :disabled="submitting" @click="resetForm">
        Reset
      </VBtn>
    </div>
  </VForm>
</template>
