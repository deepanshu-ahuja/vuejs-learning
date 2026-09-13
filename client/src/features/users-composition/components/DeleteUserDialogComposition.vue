<script setup lang="ts">
import type { User } from '@/features/users-options/types/user'

const props = withDefaults(defineProps<{
  user: User | null
  deleting?: boolean
}>(), {
  deleting: false,
})

const emit = defineEmits<{
  confirm: [user: User]
}>()

// This writable ref connects to the parent's v-model, not an independent copy.
// Setting open.value=false emits update:modelValue so the parent closes it too.
const open = defineModel<boolean>({ required: true })

function close(): void {
  if (!props.deleting) {
    open.value = false
  }
}

/** Send the selected user to the page, which owns the Pinia delete and error UI. */
function confirmDelete(): void {
  if (props.user) {
    emit('confirm', props.user)
  }
}
</script>

<template>
  <!-- persistent prevents Escape/outside-click dismissal. Cancel is also disabled
       during deletion so the confirmation stays present until the result arrives. -->
  <VDialog v-model="open" max-width="460" persistent>
    <VCard v-if="user">
      <VCardTitle>Delete user?</VCardTitle>
      <VCardText>
        Delete <strong>{{ user.name }}</strong>? This action cannot be undone.
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn variant="text" :disabled="deleting" @click="close">Cancel</VBtn>
        <VBtn color="error" :loading="deleting" @click="confirmDelete">
          Delete
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
