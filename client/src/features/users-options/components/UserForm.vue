<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { UserInput, UserRole, UserStatus } from '../types/user'

// T is the input type: ValidationRule<string> accepts text and returns either
// true (valid) or a message Vuetify displays beneath the field.
type ValidationRule<T> = (value: T) => true | string
// keyof UserInput means its field names, such as 'name' or 'email'. Record maps
// each name to a message; Partial makes each entry optional (only errors appear).
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
      // Object is Vue's runtime prop type. PropType tells TypeScript which
      // fields the object contains; `as` describes a type, not a conversion.
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
      // A factory gives each form its own empty object instead of sharing one.
      default: () => ({}),
    },
  },

  // These are messages sent to the parent, not HTTP requests. The page listens
  // with @submit and @clear-field-error and decides how to save/clear errors.
  emits: ['submit', 'clear-field-error'],

  data() {
    return {
      // data() runs once when this form instance is created. Keep an editable
      // copy so typing in Edit does not change the displayed user before Save.
      // {...value} copies these string fields into a new object. Form drafts
      // stay here; Pinia holds the shared records loaded from the server.
      form: this.initialValue ? { ...this.initialValue } : createEmptyForm(),
      // Vuetify validation returns a Promise, so another submit could arrive
      // while we await the result. Set this flag before awaiting to ignore it.
      // It belongs to this form because only this form runs these checks.
      validating: false,

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

  // Computed properties are read like values (nameRules, not nameRules()).
  // Here they supply rule arrays; Vuetify calls each rule with the field value.
  computed: {
    nameRules(): ValidationRule<string>[] {
      return [
        // `condition || message` returns true when the check passes, otherwise
        // the message. trim() ensures spaces alone do not count as a name.
        (value) => Boolean(value.trim()) || 'Name is required.',
        (value) => value.trim().length >= 2 || 'Name must be at least 2 characters.',
      ]
    },
    bioRules(): ValidationRule<string>[] {
      return [(value) => value.length <= 300 || 'Bio cannot exceed 300 characters.']
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
     * Watches the parent's initialValue prop, NOT typing in the local form.
     * Example: if an existing Edit form receives Bob after Alice, replace the
     * draft with Bob's fields and clear Alice's validation messages.
     * data() made the first copy only; it does not rerun when a prop changes.
     * This watcher runs when the prop value is replaced. It is not a deep watch
     * of individual fields. A null value means reset to the Create defaults.
     */
    initialValue(newValue: UserInput | null): void {
      this.form = newValue ? { ...newValue } : createEmptyForm()

      // Wait for Vue to apply the new form values before clearing validation.
      // `void` means we intentionally do not await the returned Promise here.
      void this.$nextTick(() => {
        const formRef = this.$refs.formRef as { resetValidation?: () => void } | undefined
        // `?.` skips the call if the ref or method is unavailable, for example
        // if the component is no longer mounted when this callback runs.
        formRef?.resetValidation?.()
      })
    },
  },

  methods: {
    /** Validate locally, then emit clean form data to the parent. */
    async submitForm(): Promise<void> {
      if (this.submitting || this.validating) return
      this.validating = true

      try {
        // `$refs` accesses the Vuetify form instance used for validation.
        const formRef = this.$refs.formRef as { validate: () => Promise<{ valid: boolean }> }
        // await pauses this method until validation resolves. Destructuring
        // { valid } reads the boolean from the returned result object.
        const { valid } = await formRef.validate()
        if (!valid || this.submitting) return

        // Send a snapshot of the draft; the parent starts the Pinia action.
        this.$emit('submit', { ...this.form })
        // emit calls the page handler, which sets creating or editing to true.
        // Vue batches component updates: this form receives submitting=true
        // when the parent updates, not immediately when its busy flag changes.
        // nextTick waits for that Vue update (it does NOT wait for the API).
        // Only then release validating, so submitting can keep blocking saves.
        await this.$nextTick()
      } finally {
        this.validating = false
      }
    },

    /** Reset values and Vuetify's validation messages. */
    resetForm(): void {
      this.form = createEmptyForm()
      // Backend errors belong to the parent; reset requests their removal too.
      for (const field of Object.keys(this.fieldErrors)) {
        this.$emit('clear-field-error', field)
      }
      const formRef = this.$refs.formRef as { resetValidation: () => void }
      formRef.resetValidation()
    },
  },
})
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

    <!-- Show the item's title ('Admin'), but save its value ('admin') in form.role. -->
    <VSelect
      v-model="form.role"
      label="Role"
      class="mt-2"
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
      @update:model-value="$emit('clear-field-error', 'bio')"
    />

    <div class="d-flex ga-3 mt-4">
      <VBtn color="primary" type="submit" :loading="submitting" :disabled="submitting || validating">
        {{ submitLabel }}
      </VBtn>
      <VBtn variant="outlined" type="button" :disabled="submitting" @click="resetForm">
        Reset
      </VBtn>
    </div>
  </VForm>
</template>
