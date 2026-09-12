<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { User } from '../types/user'

export default defineComponent({
  name: 'UserList',

  props: {
    users: {
      type: Array as PropType<User[]>,
      required: true,
    },
  },
})
</script>

<template>
  <div v-if="users.length" class="d-flex flex-column ga-3">
    <div
      v-for="(user, index) in users"
      :key="user.id"
    >
      <!--
        This is a scoped slot. UserList owns the loop and therefore knows the
        current `user` and `index`; `:user` / `:index` expose those values to
        whatever markup the parent chooses to render for each item.
      -->
      <slot name="item" :user="user" :index="index">
        <VCard variant="outlined">
          <VCardText>{{ user.name }}</VCardText>
        </VCard>
      </slot>
    </div>
  </div>

  <div v-else>
    <!--
      This is a normal named slot. The parent supplies replacement UI, but this
      slot does not need to send any child-owned data back to the parent.
    -->
    <slot name="empty">
      <VAlert type="info" variant="tonal">
        No users found.
      </VAlert>
    </slot>
  </div>
</template>
