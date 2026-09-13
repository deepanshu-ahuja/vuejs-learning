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
 * storeToRefs gives each variable a live connection to Pinia state. For example,
 * when fetchUsers replaces the users array, users.value here sees the new array.
 * Plain `const { users } = usersStore` would keep the previously read array.
 * Actions are functions, so call usersStore.createUser(...) directly.
 */
const {
  users,
  loading,
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

// Each form has one busy flag for its whole operation: save, reload the list,
// then reset Create or close Edit. Keep these here because the page coordinates
// those steps; Pinia only performs the user API actions.
// ref(false) makes a reactive boolean: use .value in script; Vue unwraps it
// automatically in the template.
const creating = ref(false)
const editing = ref(false)
const createFieldErrors = ref<ApiFieldErrors>({})
const editFieldErrors = ref<ApiFieldErrors>({})

/*
 * Template refs in <script setup> are ordinary refs. The child uses
 * defineExpose({ resetForm }), so this parent can call that one public method.
 */
const createUserForm = ref<InstanceType<typeof UserFormComposition> | null>(null)

const { snackbar, showSnackbar } = useSnackbar()

/**
 * computed derives form input from selectedUser and caches it until the reactive
 * values it reads change. Selecting Bob after Alice produces Bob's input fields.
 * It returns data; the search watcher below instead starts an external request.
 */
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
 * Watches the searchText ref, updated by the search box's v-model.
 * Type 'a', then 'al' within 350 ms: replace the first timer. A request starts
 * only when typing pauses for 350 ms (debounce). A ref can be passed directly
 * to watch; a prop needs a getter, as in the form's initialValue watcher.
 * Cancelling a timer cannot stop an HTTP request already sent; Pinia handles
 * that with AbortController.
 */
watch(searchText, () => {
  if (searchTimer) clearTimeout(searchTimer)

  searchTimer = setTimeout(() => {
    void usersStore.fetchUsers(searchText.value)
  }, SEARCH_DEBOUNCE_MS)
})

// Run once when this page enters the UI, so the first list appears without a
// search. `void` discards the Promise; fetchUsers handles list-loading failures.
onMounted(() => {
  void usersStore.fetchUsers()
})

// When leaving this page, prevent its pending timer from starting another search.
onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

/** Create a user, refresh the active search, then reset only the Create form. */
async function handleCreateUser(input: UserInput): Promise<void> {
  if (creating.value) return
  creating.value = true
  createFieldErrors.value = {}

  try {
    await usersStore.createUser(input)
    await usersStore.fetchUsers(searchText.value)
    createUserForm.value?.resetForm()
    showSnackbar('User created successfully.', 'success')
  } catch (caughtError: unknown) {
    createFieldErrors.value = getFieldErrors(caughtError)
    showSnackbar(getErrorMessage(caughtError, 'Unable to create user.'), 'error')
  } finally {
    // finally runs after success OR failure, allowing the next save/retry.
    creating.value = false
  }
}

function openDetails(user: User): void {
  selectedUser.value = user
  detailsDialogOpen.value = true
}

/** Select the record before opening Edit; the child receives its fields as initialValue. */
function openEdit(user: User): void {
  selectedUser.value = user
  editFieldErrors.value = {}
  detailsDialogOpen.value = false
  editDialogOpen.value = true
}

/** Open confirmation only. The API delete happens after the user confirms. */
function requestDelete(user: User): void {
  selectedUser.value = user
  deleteDialogOpen.value = true
}

async function handleEditUser(input: UserInput): Promise<void> {
  if (!selectedUser.value || editing.value) return

  editing.value = true
  editFieldErrors.value = {}

  try {
    await usersStore.updateUser(selectedUser.value.id, input)
    await usersStore.fetchUsers(searchText.value)
    editDialogOpen.value = false
    selectedUser.value = null
    showSnackbar('User updated successfully.', 'success')
  } catch (caughtError: unknown) {
    editFieldErrors.value = getFieldErrors(caughtError)
    showSnackbar(getErrorMessage(caughtError, 'Unable to update user.'), 'error')
  } finally {
    // Unlock after failure too, so the user can correct the draft and retry.
    editing.value = false
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

/** Typing/reset emits a field name; remove just its server message from the UI. */
function clearCreateFieldError(fieldName: keyof UserInput): void {
  delete createFieldErrors.value[fieldName]
}

function clearEditFieldError(fieldName: keyof UserInput): void {
  delete editFieldErrors.value[fieldName]
}

/**
 * A caught value is unknown: check its class before reading fieldErrors.
 * API validation failures carry field messages; network errors usually do not.
 */
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

    <!-- Vuetify uses 12 columns: each section spans the full width on small
         screens; at lg and above the form/list share a row as 5 + 7 columns. -->
    <VRow>
      <VCol cols="12" lg="5">
        <VCard rounded="lg" elevation="1">
          <VCardTitle>Create user</VCardTitle>
          <VCardSubtitle>Composition API + TypeScript + Vuetify</VCardSubtitle>

          <VCardText>
            <!--
              Values flow down through props (:submitting, :field-errors).
              Events flow up: the child's submit event carries UserInput to
              handleCreateUser. The page saves through Pinia and supplies errors.
            -->
            <UserFormComposition
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

        <UserListComposition :users="users">
          <!-- Normal named slot: the parent supplies UI, no child data needed. -->
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
            :submitting="editing"
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
            :disabled="editing"
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
