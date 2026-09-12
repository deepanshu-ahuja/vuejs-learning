<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { storeToRefs } from 'pinia'

import { ApiError, type ApiFieldErrors } from '@/api/apiClient'
import type { User, UserInput } from '@/features/users-options/types/user'
import { calculateAge } from '@/features/users-options/utils/calculateAge'
import AppSnackbar from '@/shared/components/AppSnackbar.vue'
import { useSnackbar } from '@/shared/composables/useSnackbar'

import DeleteUserDialogComposition from '../components/DeleteUserDialogComposition.vue'
import UserDetailsDialogComposition from '../components/UserDetailsDialogComposition.vue'
import UserFormComposition from '../components/UserFormComposition.vue'
import UserListComposition from '../components/UserListComposition.vue'
import { useUsersCompositionStore } from '../stores/users.store'

const SEARCH_DEBOUNCE_MS = 350

const usersStore = useUsersCompositionStore()

/*
 * A Pinia store unwraps refs on the store object. If we destructured state
 * directly (`const { users } = usersStore`), we would lose reactive linkage.
 * `storeToRefs()` creates refs for state/getters while actions stay on the store.
 */
const {
  users,
  loading,
  saving,
  deleting,
  error,
} = storeToRefs(usersStore)

const searchText = ref<string | null>('')

// The timer is implementation state, not rendered state, so it does not need
// to be a ref. Composition API does not require every local variable to be reactive.
let searchTimer: ReturnType<typeof setTimeout> | null = null

const detailsDialogOpen = ref(false)
const editDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const selectedUser = ref<User | null>(null)

const createFieldErrors = ref<ApiFieldErrors>({})
const editFieldErrors = ref<ApiFieldErrors>({})

/*
 * Template refs in <script setup> are ordinary refs. The child uses
 * defineExpose({ resetForm }), so this parent can call that one public method.
 */
const createUserForm = ref<InstanceType<typeof UserFormComposition> | null>(null)

const { snackbar, showSnackbar } = useSnackbar()

/** Derive the exact editable shape expected by UserFormComposition. */
const selectedUserInput = computed<UserInput | null>(() => {
  if (!selectedUser.value) return null

  const {
    name,
    email,
    role,
    status,
    dateOfBirth,
    bio,
  } = selectedUser.value

  return {
    name,
    email,
    role,
    status,
    dateOfBirth,
    bio,
  }
})

/*
 * `watch()` is appropriate because changing searchText causes an external side
 * effect: fetching from the backend. Debounce waits until typing pauses.
 * Request cancellation itself stays in Pinia because it belongs to the request.
 */
watch(searchText, () => {
  if (searchTimer) clearTimeout(searchTimer)

  searchTimer = setTimeout(() => {
    void usersStore.fetchUsers(searchText.value)
  }, SEARCH_DEBOUNCE_MS)
})

// `onMounted` is the Composition API lifecycle equivalent of Options `mounted`.
onMounted(() => {
  void usersStore.fetchUsers()
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

/** Create a user, refresh the active search, then reset only the Create form. */
async function handleCreateUser(input: UserInput): Promise<void> {
  createFieldErrors.value = {}

  try {
    await usersStore.createUser(input)
    await usersStore.fetchUsers(searchText.value)
    createUserForm.value?.resetForm()
    showSnackbar('User created successfully.', 'success')
  } catch (caughtError: unknown) {
    createFieldErrors.value = getFieldErrors(caughtError)
    showSnackbar(getErrorMessage(caughtError, 'Unable to create user.'), 'error')
  }
}

function openDetails(user: User): void {
  selectedUser.value = user
  detailsDialogOpen.value = true
}

function openEdit(user: User): void {
  selectedUser.value = user
  editFieldErrors.value = {}
  detailsDialogOpen.value = false
  editDialogOpen.value = true
}

function requestDelete(user: User): void {
  selectedUser.value = user
  deleteDialogOpen.value = true
}

async function handleEditUser(input: UserInput): Promise<void> {
  if (!selectedUser.value) return

  editFieldErrors.value = {}

  try {
    await usersStore.updateUser(selectedUser.value.id, input)
    editDialogOpen.value = false
    selectedUser.value = null
    await usersStore.fetchUsers(searchText.value)
    showSnackbar('User updated successfully.', 'success')
  } catch (caughtError: unknown) {
    editFieldErrors.value = getFieldErrors(caughtError)
    showSnackbar(getErrorMessage(caughtError, 'Unable to update user.'), 'error')
  }
}

async function confirmDelete(user: User): Promise<void> {
  try {
    await usersStore.deleteUser(user.id)
    deleteDialogOpen.value = false
    selectedUser.value = null
    await usersStore.fetchUsers(searchText.value)
    showSnackbar('User deleted successfully.', 'success')
  } catch (caughtError: unknown) {
    showSnackbar(getErrorMessage(caughtError, 'Unable to delete user.'), 'error')
  }
}

function clearCreateFieldError(fieldName: keyof UserInput): void {
  delete createFieldErrors.value[fieldName]
}

function clearEditFieldError(fieldName: keyof UserInput): void {
  delete editFieldErrors.value[fieldName]
}

function getFieldErrors(caughtError: unknown): ApiFieldErrors {
  return caughtError instanceof ApiError ? caughtError.fieldErrors : {}
}

function getErrorMessage(caughtError: unknown, fallback: string): string {
  return caughtError instanceof Error ? caughtError.message : fallback
}
</script>

<template>
  <VContainer class="py-8">
    <h1 class="mb-6">Users — Composition API</h1>

    <VRow>
      <VCol cols="12" lg="5">
        <VCard rounded="lg" elevation="1">
          <VCardTitle>Create user</VCardTitle>
          <VCardSubtitle>Composition API + TypeScript + Vuetify</VCardSubtitle>

          <VCardText>
            <UserFormComposition
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

        <UserListComposition :users="users">
          <!-- Normal named slot: the parent supplies UI, no child data needed. -->
          <template #empty>
            <VAlert type="info" variant="tonal">
              {{ searchText ? 'No users match this search.' : 'No users have been created yet.' }}
            </VAlert>
          </template>

          <!-- Scoped slot: the child exposes each current user to this markup. -->
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
        </UserListComposition>
      </VCol>
    </VRow>

    <UserDetailsDialogComposition
      v-model="detailsDialogOpen"
      :user="selectedUser"
      @edit="openEdit"
    />

    <VDialog v-model="editDialogOpen" max-width="680" persistent>
      <VCard>
        <VCardTitle>Edit user</VCardTitle>
        <VCardText>
          <UserFormComposition
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
          <VBtn
            variant="text"
            :disabled="saving"
            @click="editDialogOpen = false"
          >
            Close
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <DeleteUserDialogComposition
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
