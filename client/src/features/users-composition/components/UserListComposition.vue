<script setup lang="ts">
import type { User } from '@/features/users-options/types/user'

// Type-only props need no runtime object syntax in <script setup>.
defineProps<{
  users: User[]
}>()

/*
 * `defineSlots()` documents the slot contract for TypeScript/editor tooling.
 * - `empty` is a normal named slot: no child data is exposed.
 * - `item` is a scoped slot: the child exposes `user` and `index` to the parent.
 */
defineSlots<{
  empty(): unknown
  item(props: { user: User; index: number }): unknown
}>()
</script>

<template>
  <div v-if="users.length" class="d-flex flex-column ga-3">
    <!-- A stable id lets Vue match each card to its user when a search or save
         changes list order. An array index identifies a position, not a user. -->
    <div
      v-for="(user, index) in users"
      :key="user.id"
    >
      <!-- `:user` and `:index` are slot props supplied by this child. -->
      <!-- Content inside slot is the fallback when the parent supplies no #item. -->
      <slot name="item" :user="user" :index="index">
        <VCard variant="outlined">
          <VCardText>{{ user.name }}</VCardText>
        </VCard>
      </slot>
    </div>
  </div>

  <div v-else>
    <!-- Normal named slot: parent can replace the empty UI, no data required. -->
    <slot name="empty">
      <VAlert type="info" variant="tonal">
        No users found.
      </VAlert>
    </slot>
  </div>
</template>
