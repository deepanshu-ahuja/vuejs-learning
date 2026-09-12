<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { User } from '../types/user'

export default defineComponent({
  name: 'DeleteUserDialog',

  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    user: {
      type: Object as PropType<User | null>,
      default: null,
    },
    deleting: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['update:modelValue', 'confirm'],

  methods: {
    close(): void {
      if (!this.deleting) {
        this.$emit('update:modelValue', false)
      }
    },
  },
})
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="460"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <VCard v-if="user">
      <VCardTitle>Delete user?</VCardTitle>
      <VCardText>
        Delete <strong>{{ user.name }}</strong>? This action cannot be undone.
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn variant="text" :disabled="deleting" @click="close">Cancel</VBtn>
        <VBtn color="error" :loading="deleting" @click="$emit('confirm', user)">
          Delete
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
