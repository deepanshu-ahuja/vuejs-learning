<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { UserInput, UserRole, UserStatus } from '../types/user'

/**
 * A Vuetify rule returns `true` when the value is valid, otherwise it returns
 * the error text Vuetify should display under the field.
 */
type ValidationRule<T> = (value: T) => true | string

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
    /**
     * Optional existing values make the same form reusable for Edit later.
     * `PropType<UserInput>` gives an object prop a precise TypeScript shape.
     */
    initialValue: {
      type: Object as PropType<UserInput>,
      default: null,
    },
    submitting: {
      type: Boolean,
      default: false,
    },
  },

  // Declaring emitted events documents the component's public API.
  emits: ['submit'],

  data() {
    return {
      // Copy the object rather than storing the prop itself. Mutating a prop
      // directly would break Vue's one-way parent -> child data flow.
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
      ]
    },
  },

  methods: {
    /**
     * Validates all fields through VForm before emitting data to the parent.
     * The parent decides what "submit" means (create now, edit later).
     */
    async submitForm(): Promise<void> {
      // `$refs` contains template refs declared with `ref="..."`. Vuetify's
      // VForm exposes an imperative `validate()` method through that ref.
      const formRef = this.$refs.formRef as { validate: () => Promise<{ valid: boolean }> }
      const { valid } = await formRef.validate()

      if (!valid) {
        return
      }

      // Emit a copy so the parent/store cannot accidentally mutate this
      // component's local form object by reference.
      this.$emit('submit', { ...this.form })
    },

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
      autocomplete="name"
    />

    <VTextField
      v-model="form.email"
      label="Email"
      type="email"
      :rules="emailRules"
      autocomplete="email"
    />

    <VSelect
      v-model="form.role"
      label="Role"
      :items="roles"
      item-title="title"
      item-value="value"
    />

    <VSelect
      v-model="form.status"
      label="Status"
      :items="statuses"
      item-title="title"
      item-value="value"
    />

    <!-- Native date input keeps the first learning slice simple. We can swap
         this field for the project's chosen Vuetify date-picker experience
         later without changing the form's data contract. -->
    <VTextField
      v-model="form.dateOfBirth"
      label="Date of birth"
      type="date"
      :rules="dateOfBirthRules"
    />

    <VTextarea
      v-model="form.bio"
      label="Bio"
      rows="3"
      counter="300"
    />

    <div class="d-flex ga-3 mt-4">
      <VBtn
        color="primary"
        type="submit"
        :loading="submitting"
      >
        Save user
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
