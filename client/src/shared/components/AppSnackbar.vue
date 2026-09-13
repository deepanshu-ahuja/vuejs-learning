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
  <!--
    The parent owns open/closed state. Its v-model="open" expands to
    :model-value="open" and @update:model-value="open = $event".
    This wrapper passes the value into Vuetify and forwards its update event
    back up. $event is the new boolean. This avoids assigning to our prop.
  -->
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
