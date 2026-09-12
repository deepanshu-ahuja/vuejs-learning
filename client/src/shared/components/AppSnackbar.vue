<script lang="ts">
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  name: 'AppSnackbar',

  props: {
    // `modelValue` is the prop Vue uses for the default `v-model` contract.
    modelValue: {
      type: Boolean,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    color: {
      type: String as PropType<'success' | 'error' | 'info' | 'warning'>,
      default: 'success',
    },
  },

  // Emitting `update:modelValue` completes the default v-model contract.
  emits: ['update:modelValue'],
})
</script>

<template>
  <VSnackbar
    :model-value="modelValue"
    :color="color"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    {{ message }}

    <template #actions>
      <VBtn
        variant="text"
        @click="$emit('update:modelValue', false)"
      >
        Close
      </VBtn>
    </template>
  </VSnackbar>
</template>
