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

const open = defineModel<boolean>({ required: true })

function close(): void {
  if (!props.deleting) {
    open.value = false
  }
}

function confirmDelete(): void {
  if (props.user) {
    emit('confirm', props.user)
  }
}
</script>

<template>
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
