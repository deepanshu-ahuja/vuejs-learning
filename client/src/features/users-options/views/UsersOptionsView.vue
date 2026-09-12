<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'pinia'

import AppSnackbar from '@/shared/components/AppSnackbar.vue'
import UserForm from '../components/UserForm.vue'
import { useUsersStore } from '../stores/users.store'
import type { UserInput } from '../types/user'

export default defineComponent({
  name: 'UsersOptionsView',

  components: {
    AppSnackbar,
    UserForm,
  },

  data() {
    return {
      // Snackbar presentation is reusable, but its state stays local because
      // only this page currently needs these create-user notifications.
      snackbar: {
        open: false,
        message: '',
        color: 'success' as 'success' | 'error',
      },
    }
  },

  computed: {
    /**
     * `mapState()` creates computed properties backed by Pinia state. This is
     * the Options API-friendly way to read the store without switching the
     * whole component to Composition API syntax.
     */
    ...mapState(useUsersStore, ['users', 'loading', 'saving', 'error']),
  },

  methods: {
    /**
     * `mapActions()` exposes Pinia actions as component methods. Calls still
     * execute against the store instance and can update shared store state.
     */
    ...mapActions(useUsersStore, ['fetchUsers', 'createUser']),

    async handleCreateUser(input: UserInput): Promise<void> {
      try {
        await this.createUser(input)
        this.showSnackbar('User created successfully.', 'success')
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unable to create user.'
        this.showSnackbar(message, 'error')
      }
    },

    showSnackbar(message: string, color: 'success' | 'error'): void {
      this.snackbar.message = message
      this.snackbar.color = color
      this.snackbar.open = true
    },
  },
})
</script>

<template>
  <VContainer class="py-8">
    <VRow>
      <VCol cols="12" md="7" lg="6">
        <VCard rounded="lg" elevation="1">
          <VCardTitle>Create user</VCardTitle>
          <VCardSubtitle>
            Options API + TypeScript + Vuetify
          </VCardSubtitle>

          <VCardText>
            <UserForm
              :submitting="saving"
              @submit="handleCreateUser"
            />
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="5" lg="6">
        <VAlert type="info" variant="tonal" class="mb-4">
          The simple searchable user list will appear here next. It will use
          regular <code>v-for</code>, not VDataTable.
        </VAlert>

        <VAlert
          v-if="error"
          type="error"
          variant="tonal"
        >
          {{ error }}
        </VAlert>
      </VCol>
    </VRow>

    <AppSnackbar
      v-model="snackbar.open"
      :message="snackbar.message"
      :color="snackbar.color"
    />
  </VContainer>
</template>
