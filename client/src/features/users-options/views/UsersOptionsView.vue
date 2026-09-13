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

  // Register imported components so their names can be used in this template.
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
      // Each form has one busy flag for its whole operation: save, reload the
      // list, then reset Create or close Edit. Keep these here because the page
      // coordinates those steps; Pinia only performs the user API actions.
      creating: false,
      editing: false,
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
    /**
     * mapState creates computed properties that read the store's current values.
     * `...` inserts them here, so the template can use users and loading directly.
     * This is not a one-time copy: a fetched user list updates the rendered list.
     */
    ...mapState(useUsersStore, ['users', 'loading', 'deleting', 'error']),

    /**
     * Derive the form input from selectedUser; exclude server-owned id/timestamps.
     * Vue tracks selectedUser reads and recalculates when that selection changes.
     * Unlike a watcher, this returns derived data instead of starting a side effect.
     */
    selectedUserInput(): UserInput | null {
      if (!this.selectedUser) return null

      const { name, email, role, status, dateOfBirth, bio } = this.selectedUser
      return { name, email, role, status, dateOfBirth, bio }
    },
  },

  watch: {
    /**
     * Watches searchText, which the search box updates through v-model.
     * Type 'a', then 'al' within 350 ms: cancel the first timer and start a new
     * one. Only after typing pauses for 350 ms do we request the current text.
     * This delay is debounce. Clearing a timer cannot cancel an HTTP request
     * already sent; the store uses AbortController for that separate problem.
     */
    searchText(): void {
      if (this.searchTimer) clearTimeout(this.searchTimer)

      this.searchTimer = setTimeout(() => {
        void this.fetchUsers(this.searchText)
      }, SEARCH_DEBOUNCE_MS)
    },
  },

  mounted() {
    // mounted runs after this page enters the UI. Load the first list without
    // requiring typing. `void` discards the Promise; fetchUsers handles errors.
    void this.fetchUsers()
  },

  // Leaving this route removes the page. Cancel its pending search timer so it
  // does not start a request later for a page the user has already left.
  beforeUnmount() {
    if (this.searchTimer) clearTimeout(this.searchTimer)
  },

  methods: {
    // Expose store actions as this.createUser(), etc. Calls still execute in
    // Pinia; the component does not need HTTP or database details.
    ...mapActions(useUsersStore, [
      'fetchUsers',
      'createUser',
      'updateUser',
      'deleteUser',
    ]),

    calculateAge,

    async handleCreateUser(input: UserInput): Promise<void> {
      if (this.creating) return
      // Ignore another create event until this whole workflow has finished.
      this.creating = true
      this.createFieldErrors = {}

      try {
        await this.createUser(input)
        await this.fetchUsers(this.searchText)

        // ref="createUserForm" identifies the child form, not the HTML form.
        // Its public resetForm method clears the draft only after a successful
        // save. InstanceType tells TypeScript which child methods are available.
        const form = this.$refs.createUserForm as InstanceType<typeof UserForm>
        form.resetForm()

        this.showSnackbar('User created successfully.', 'success')
      } catch (error: unknown) {
        this.createFieldErrors = this.getFieldErrors(error)
        this.showSnackbar(this.getErrorMessage(error, 'Unable to create user.'), 'error')
      } finally {
        // finally runs after success OR failure, allowing the next save/retry.
        this.creating = false
      }
    },

    openDetails(user: User): void {
      this.selectedUser = user
      this.detailsDialogOpen = true
    },

    /** Select the record before opening Edit; the child receives its fields as initialValue. */
    openEdit(user: User): void {
      this.selectedUser = user
      this.editFieldErrors = {}
      this.detailsDialogOpen = false
      this.editDialogOpen = true
    },

    /** Open confirmation only. The API delete happens after the user confirms. */
    requestDelete(user: User): void {
      this.selectedUser = user
      this.deleteDialogOpen = true
    },

    async handleEditUser(input: UserInput): Promise<void> {
      if (!this.selectedUser || this.editing) return

      this.editing = true
      this.editFieldErrors = {}

      try {
        await this.updateUser(this.selectedUser.id, input)
        await this.fetchUsers(this.searchText)
        this.editDialogOpen = false
        this.selectedUser = null
        this.showSnackbar('User updated successfully.', 'success')
      } catch (error: unknown) {
        this.editFieldErrors = this.getFieldErrors(error)
        this.showSnackbar(this.getErrorMessage(error, 'Unable to update user.'), 'error')
      } finally {
        // Unlock after failure too, so the user can correct the draft and retry.
        this.editing = false
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
      // A child emits this field name when typing or resetting. Delete only
      // that message; Vue observes the deletion and removes it from the field.
      delete this.createFieldErrors[fieldName]
    },

    clearEditFieldError(fieldName: string): void {
      delete this.editFieldErrors[fieldName]
    },

    /**
     * A caught value is unknown: check its class before reading fieldErrors.
     * API validation failures carry field messages; network errors usually do not.
     */
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

    <!-- Vuetify uses 12 columns: each section spans the full width on small
         screens; at lg and above the form/list share a row as 5 + 7 columns. -->
    <VRow>
      <VCol cols="12" lg="5">
        <VCard rounded="lg" elevation="1">
          <VCardTitle>Create user</VCardTitle>
          <VCardSubtitle>Options API + TypeScript + Vuetify</VCardSubtitle>
          <VCardText>
            <!--
              Values flow down through props (:submitting, :field-errors).
              Events flow up: the child's submit event carries UserInput to
              handleCreateUser. The page saves through Pinia and supplies errors.
            -->
            <UserForm
              ref="createUserForm"
              :submitting="creating"
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

          <!--
            #item is shorthand for v-slot:item. { user } receives the current
            loop item supplied by UserList's <slot :user="user">. The child
            chooses which item; this parent chooses how its card looks.
          -->
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
            :submitting="editing"
            :field-errors="editFieldErrors"
            submit-label="Update user"
            @submit="handleEditUser"
            @clear-field-error="clearEditFieldError"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" :disabled="editing" @click="editDialogOpen = false">Close</VBtn>
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
