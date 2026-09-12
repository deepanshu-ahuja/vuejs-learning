import { createRouter, createWebHistory } from 'vue-router'
import UsersOptionsView from '@/features/users-options/views/UsersOptionsView.vue'

const router = createRouter({
  // `createWebHistory()` gives normal URLs such as /options/users instead of
  // hash URLs such as /#/options/users.
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/options/users',
    },
    {
      path: '/options/users',
      name: 'options-users',
      component: UsersOptionsView,
    },
  ],
})

export default router
