<template>
  <!-- Vuetify expects one VApp near the root so application layout components
       can coordinate their sizing and theme correctly. -->
  <VApp>
    <VAppBar elevation="1">
      <VAppBarTitle>Vue Learning</VAppBarTitle>

      <VBtn to="/options/users" variant="text">
        Options API
      </VBtn>

      <VBtn to="/composition/users" variant="text">
        Composition API
      </VBtn>
    </VAppBar>

    <!-- VMain automatically respects application layout components such as the
         app bar, so page content starts below it without manual top padding. -->
    <VMain>
      <!-- Vue Router replaces RouterView with the component for the active URL. -->
      <RouterView />
    </VMain>
  </VApp>
</template>
