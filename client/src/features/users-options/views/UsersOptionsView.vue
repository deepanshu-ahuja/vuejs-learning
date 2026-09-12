<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'pinia'

import { ApiError, type ApiFieldErrors } from '@/api/apiClient'
import AppSnackbar from '@/shared/components/AppSnackbar.vue'
import DeleteUserDialog from '../components/DeleteUserDialog.vue'
import UserDetailsDialog from '../components/UserDetailsDialog.vue'
import UserForm from '../components/UserForm.vue'
import UserList from '../components/UserList.vue'
import { useUsersStore } from '../stores/users.store'
import type { User, UserInput } from '../types/user'
import { calculateAge } from '../utils/calculateAge'

const SEARCH_DEBOUNCE_MS = 350

export default defineComponent({
  name: 'UsersOptionsView',

  components: {
    AppSnackbar,
    DeleteUserDialog,
    UserDetailsDialog,
    UserForm,
    UserList,
  },

  data() {
    return {
      searchText: '',
      // This type works with both browser and Node timer typings.
      searchTimer: null as ReturnType<typeof setTimeout> | null,

      detailsDialogOpen: false,
      editDialogOpen: false,
      deleteDialogOpen: false,
      selectedUser: null as User | null,

      createFieldErrors: {} as ApiFieldErrors,
      editFieldErrors: {} as ApiFieldErrors,

      // Snackbar UI is reusable, but this state remains local because only this
      // page currently needs these CRUD notifications.
      snackbar: {
        open: false,
        message: '',
        color: 'success' as 'success' | 'error',
      },
    }
  },

  computed: {
    /** Options API-friendly computed access to Pinia state. */
    ...mapState(useUsersStore, ['users', 'loading', 'saving', 'deleting', 'error']),

    /** Convert the server User into exactly the fields UserForm edits. */
    selectedUserInput(): UserInput | null {
      if (!this.selectedUser) return null

      const { name, email, role, status, dateOfBirth, bio } = this.selectedUser
      return { name, email, role, status, dateOfBirth, bio }
    },
  },

  watch: {
    /**
     * A watcher fits here because changing reactive `searchText` should cause
     * an external side effect: a backend request.
     *
     * Debounce waits until typing pauses. AbortController in the Pinia action
     * solves a separate problem: cancelling an older request already in flight.
     */
    searchText(): void {
      if (this.searchTimer) clearTimeout(this.searchTimer)

      this.searchTimer = setTimeout(() => {
        void this.fetchUsers(this.searchText)
      }, SEARCH_DEBOUNCE_MS)
    },
  },

  mounted() {
    // Initial data loading is a lifecycle side effect.
    void this.fetchUsers()
  },

  beforeUnmount() {
    if (this.searchTimer) clearTimeout(this.searchTimer)
  },

  methods: {
    ...mapActions(useUsersStore, [
      'fetchUsers',
      'createUser',
      'updateUser',
      'deleteUser',
    ]),

    calculateAge,

    async handleCreateUser(input: UserInput): Promise<void> {
      this.createFieldErrors = {}

      try {
        await this.createUser(input)
        await this.fetchUsers(this.searchText)

        // Options API component refs expose public component methods.
        const form = this.$refs.createUserForm as InstanceType<typeof UserForm>
        form.resetForm()

        this.showSnackbar('User created successfully.', 'success')
      } catch (error: unknown) {
        this.createFieldErrors = this.getFieldErrors(error)
        this.showSnackbar(this.getErrorMessage(error, 'Unable to create user.'), 'error')
      }
    },

    openDetails(user: User): void {
      this.selectedUser = user
      this.detailsDialogOpen = true
    },

    openEdit(user: User): void {
      this.selectedUser = user
      this.editFieldErrors = {}
      this.detailsDialogOpen = false
      this.editDialogOpen = true
    },

    requestDelete(user: User): void {
      this.selectedUser = user
      this.deleteDialogOpen = true
    },

    async handleEditUser(input: UserInput): Promise<void> {
      if (!this.selectedUser) return

      this.editFieldErrors = {}

      try {
        await this.updateUser(this.selectedUser.id, input)
        this.editDialogOpen = false
        this.selectedUser = null
        await this.fetchUsers(this.searchText)
        this.showSnackbar('User updated successfully.', 'success')
      } catch (error: unknown) {
        this.editFieldErrors = this.getFieldErrors(error)
        this.showSnackbar(this.getErrorMessage(error, 'Unable to update user.'), 'error')
      }
    },

    async confirmDelete(user: User): Promise<void> {
      try {
        await this.deleteUser(user.id)
        this.deleteDialogOpen = false
        this.selectedUser = null
        await this.fetchUsers(this.searchText)
        this.showSnackbar('User deleted successfully.', 'success')
      } catch (error: unknown) {
        this.showSnackbar(this.getErrorMessage(error, 'Unable to delete user.'), 'error')
      }
    },

    clearCreateFieldError(fieldName: string): void {
      // Vue 3's Proxy reactivity tracks property deletion.
      delete this.createFieldErrors[fieldName]
    },

    clearEditFieldError(fieldName: string): void {
      delete this.editFieldErrors[fieldName]
    },

    getFieldErrors(error: unknown): ApiFieldErrors {
      return error instanceof ApiError ? error.fieldErrors : {}
    },

    getErrorMessage(error: unknown, fallback: string): string {
      return error instanceof Error ? error.message : fallback
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
    <h1 class="mb-6">Users — Options API</h1>

    <VRow>
      <VCol cols="12" lg="5">
        <VCard rounded="lg" elevation="1">
          <VCardTitle>Create user</VCardTitle>
          <VCardSubtitle>Options API + TypeScript + Vuetify</VCardSubtitle>
          <VCardText>
            <UserForm
              ref="createUserForm"
              :submitting="saving"
              :field-errors="createFieldErrors"
              @submit="handleCreateUser"
              @clear-field-error="clearCreateFieldError"
            />
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" lg="7">
        <VTextField
          v-model="searchText"
          label="Search users by name or email"
          clearable
          hide-details
          class="mb-4"
        />

        <VProgressLinear v-if="loading" indeterminate class="mb-3" />

        <VAlert v-if="error" type="error" variant="tonal" class="mb-4">
          {{ error }}
        </VAlert>

        <UserList :users="users">
          <!-- Normal named slot: parent supplies UI; child supplies no data. -->
          <template #empty>
            <VAlert type="info" variant="tonal">
              {{ searchText ? 'No users match this search.' : 'No users have been created yet.' }}
            </VAlert>
          </template>

          <!-- Scoped slot: UserList exposes its current `user` to this markup. -->
          <template #item="{ user }">
            <VCard variant="outlined" rounded="lg">
              <VCardText>
                <div class="d-flex align-center ga-3 flex-wrap">
                  <div class="flex-grow-1">
                    <div class="text-h6">{{ user.name }}</div>
                    <div class="text-medium-emphasis">{{ user.email }}</div>
                    <div class="mt-1">
                      {{ user.role }} · {{ calculateAge(user.dateOfBirth) }} years
                    </div>
                  </div>

                  <VChip
                    :color="user.status === 'active' ? 'success' : 'secondary'"
                    size="small"
                  >
                    {{ user.status }}
                  </VChip>
                </div>
              </VCardText>

              <VCardActions>
                <VBtn variant="text" @click="openDetails(user)">View</VBtn>
                <VBtn variant="text" @click="openEdit(user)">Edit</VBtn>
                <VBtn color="error" variant="text" @click="requestDelete(user)">Delete</VBtn>
              </VCardActions>
            </VCard>
          </template>
        </UserList>
      </VCol>
    </VRow>

    <UserDetailsDialog
      v-model="detailsDialogOpen"
      :user="selectedUser"
      @edit="openEdit"
    />

    <VDialog v-model="editDialogOpen" max-width="680" persistent>
      <VCard>
        <VCardTitle>Edit user</VCardTitle>
        <VCardText>
          <UserForm
            :initial-value="selectedUserInput"
            :submitting="saving"
            :field-errors="editFieldErrors"
            submit-label="Update user"
            @submit="handleEditUser"
            @clear-field-error="clearEditFieldError"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" :disabled="saving" @click="editDialogOpen = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <DeleteUserDialog
      v-model="deleteDialogOpen"
      :user="selectedUser"
      :deleting="deleting"
      @confirm="confirmDelete"
    />

    <AppSnackbar
      v-model="snackbar.open"
      :message="snackbar.message"
      :color="snackbar.color"
    />
  </VContainer>
</template>
