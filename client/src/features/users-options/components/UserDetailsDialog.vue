<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { User } from '../types/user'
import { calculateAge } from '../utils/calculateAge'

export default defineComponent({
  name: 'UserDetailsDialog',

  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    user: {
      type: Object as PropType<User | null>,
      default: null,
    },
  },

  // `modelValue` + `update:modelValue` is the default custom-component v-model contract.
  emits: ['update:modelValue', 'edit'],

  methods: {
    calculateAge,
    close(): void {
      this.$emit('update:modelValue', false)
    },
  },
})
</script>

<template>
  <!--
    The parent owns open/closed state. Its v-model="open" expands to
    :model-value="open" and @update:model-value="open = $event".
    This wrapper passes the value into Vuetify and forwards its update event
    back up. $event is the new boolean. This avoids assigning to our prop.
  -->
  <VDialog
    :model-value="modelValue"
    max-width="560"
    @update:model-value="$emit('update:modelValue', $event)"
  >
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
        <VBtn color="primary" @click="$emit('edit', user)">Edit</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
