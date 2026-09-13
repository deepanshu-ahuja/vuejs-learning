<script setup lang="ts">
import type { User } from '@/features/users-options/types/user'
import { calculateAge } from '@/features/users-options/utils/calculateAge'

const props = defineProps<{
  user: User | null
}>()

const emit = defineEmits<{
  edit: [user: User]
}>()

/*
 * `defineModel()` is the modern Composition API helper for a component's
 * default v-model contract. It represents modelValue + update:modelValue as one
 * writable ref, so `open.value = false` notifies the parent automatically.
 */
const open = defineModel<boolean>({ required: true })

function close(): void {
  open.value = false
}

/** Ask the page to switch from Details to Edit; this dialog does not save data. */
function editUser(): void {
  if (props.user) {
    emit('edit', props.user)
  }
}
</script>

<template>
  <VDialog v-model="open" max-width="560">
    <VCard v-if="user">
      <VCardTitle>{{ user.name }}</VCardTitle>
      <VCardSubtitle>{{ user.email }}</VCardSubtitle>

      <VCardText class="d-flex flex-column ga-2">
        <div><strong>Role:</strong> {{ user.role }}</div>
        <div><strong>Status:</strong> {{ user.status }}</div>
        <div><strong>Date of birth:</strong> {{ user.dateOfBirth }}</div>
        <div><strong>Age:</strong> {{ calculateAge(user.dateOfBirth) }}</div>
        <div><strong>Bio:</strong> {{ user.bio || '—' }}</div>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn variant="text" @click="close">Close</VBtn>
        <VBtn color="primary" @click="editUser">Edit</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
